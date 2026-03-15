import asyncio
import base64
import json
from datetime import datetime, timezone, timedelta

from fastapi import WebSocket

from config import settings
from models import CallSession
from clients.deepgram import create_deepgram_connection
from clients.deepseek import chat
from clients.azure_tts import text_to_speech
from clients.twilio import colgar_llamada
from storage.session_store import sessions, session_lock
from storage.db_service import finalizar_llamada
from db_models import EstadoTicket
from services.audio_service import audios
from logger import get_logger

log = get_logger("stream_service")

COLOMBIA_TZ = timezone(timedelta(hours=-5))
PASOS_DTMF  = {2, 4}
TIPOS_FALLA = {"1": "falla_total", "2": "luz_bajita", "3": "microcortes"}


class CallStreamHandler:
    """Maneja el ciclo completo de un WebSocket de Twilio para una llamada."""

    def __init__(self, websocket: WebSocket) -> None:
        self.ws              = websocket
        self.session: CallSession = None
        self.dg_conn         = None
        self.stream_sid: str = None
        self.loop            = asyncio.get_event_loop()
        self.ia_hablando     = False
        self.dtmf_pendiente: str = None
        self.timeout_task: asyncio.Task = None
        self.repeticiones    = 0

    # ── entrada principal ─────────────────────────────────────────────────────

    async def run(self) -> None:
        await self.ws.accept()
        try:
            async for message in self.ws.iter_text():
                data  = json.loads(message)
                event = data.get("event")

                if event == "start":
                    if not await self._on_start(data):
                        break
                elif event == "dtmf":
                    await self._on_dtmf(data)
                elif event == "media":
                    self._on_media(data)
                elif event == "stop":
                    log.info("Evento stop recibido — stream_sid=%s", self.stream_sid)
                    break
        except Exception as e:
            log.error("Error inesperado en stream %s: %s", self.stream_sid, e)
        finally:
            self._cleanup()

    # ── handlers de eventos Twilio ────────────────────────────────────────────

    async def _on_start(self, data: dict) -> bool:
        self.stream_sid = data["start"]["streamSid"]
        call_sid        = data["start"]["callSid"]

        async with session_lock:
            self.session = sessions.get(call_sid)

        if not self.session:
            log.warning("Sesión no encontrada para call_sid=%s", call_sid)
            return False

        log.info("Stream iniciado — call_sid=%s stream_sid=%s", call_sid, self.stream_sid)

        self.dg_conn = create_deepgram_connection(
            lambda t: asyncio.run_coroutine_threadsafe(
                self.procesar_input(t, es_dtmf=False), self.loop
            )
        )

        asyncio.create_task(self._enviar_saludo())
        return True

    async def _on_dtmf(self, data: dict) -> None:
        digito = data.get("dtmf", {}).get("digit", "")
        if not digito:
            return
        if self.ia_hablando:
            self.dtmf_pendiente = digito
        else:
            await self.procesar_input(digito, es_dtmf=True)

    def _on_media(self, data: dict) -> None:
        if not self.dg_conn:
            return
        try:
            self.dg_conn.send(base64.b64decode(data["media"]["payload"]))
        except Exception as e:
            log.warning("Error enviando audio a Deepgram: %s", e)

    def _cleanup(self) -> None:
        if self.timeout_task and not self.timeout_task.done():
            self.timeout_task.cancel()
        if self.dg_conn:
            try:
                self.dg_conn.finish()
            except Exception as e:
                log.warning("Error cerrando conexión Deepgram: %s", e)

    # ── audio ─────────────────────────────────────────────────────────────────

    async def _enviar_saludo(self) -> None:
        await self._enviar_audio(self.session.saludo_audio)
        await self._enviar_audio(audios["p1"])
        self._reiniciar_timeout()

    async def _enviar_audio(self, audio: bytes) -> None:
        self.ia_hablando = True
        audio_b64 = base64.b64encode(audio).decode("utf-8")
        await self.ws.send_text(json.dumps({
            "event": "media",
            "streamSid": self.stream_sid,
            "media": {"payload": audio_b64},
        }))
        await asyncio.sleep(len(audio) / 8000 + 1.0)
        self.ia_hablando = False

        if self.dtmf_pendiente and self.session and not self.session.terminada:
            digito = self.dtmf_pendiente
            self.dtmf_pendiente = None
            await self.procesar_input(digito, es_dtmf=True)

    # ── timeout de silencio ───────────────────────────────────────────────────

    def _reiniciar_timeout(self) -> None:
        if self.timeout_task and not self.timeout_task.done():
            self.timeout_task.cancel()
        if self.session and not self.session.terminada:
            self.timeout_task = asyncio.create_task(self._timeout_silencio())

    async def _timeout_silencio(self) -> None:
        await asyncio.sleep(settings.TIMEOUT_SILENCIO)
        if not self.session or self.session.terminada or self.ia_hablando:
            return
        if self.repeticiones >= settings.MAX_REPETICIONES:
            log.info("Máximo de repeticiones alcanzado — terminando llamada")
            await self._enviar_audio(audios["silencio"])
            await self._terminar_llamada("sin_respuesta", EstadoTicket.no_contesto)
            return
        self.repeticiones += 1
        clave = {2: "p1", 3: "p2", 4: "p3"}.get(self.session.paso_actual)
        if clave:
            await self._enviar_audio(audios[clave])
        self._reiniciar_timeout()

    # ── ciclo de vida de la llamada ───────────────────────────────────────────

    async def _terminar_llamada(self, resultado: str, estado_ticket: EstadoTicket) -> None:
        if self.timeout_task and not self.timeout_task.done():
            self.timeout_task.cancel()
        self.session.terminada = True
        log.info("Terminando llamada %s — resultado=%s", self.session.call_sid, resultado)

        if self.session.llamada_id:
            await finalizar_llamada(
                llamada_id=self.session.llamada_id,
                ticket_id=self.session.ticket_id,
                resultado=resultado,
                estado_ticket=estado_ticket,
                sector=self.session.sector,
                tipo_afectacion=self.session.tipo_afectacion,
                historial=self.session.historial,
                respuestas=self.session.respuestas,
            )

        await asyncio.sleep(1)
        try:
            colgar_llamada(self.session.call_sid)
        except Exception as e:
            log.error("Error al colgar llamada %s: %s", self.session.call_sid, e)

    # ── pasos del flujo IVR ───────────────────────────────────────────────────

    async def _paso_2(self, digito: str) -> None:
        """¿Tiene servicio? 1=Sí  2=No"""
        self.session.historial.append({"role": "user", "content": digito})
        if digito == "1":
            self.session.historial.append({"role": "assistant", "content": settings.TEXTO_SERV_OK})
            self.session.respuestas.append({"pregunta": "¿Cuenta con servicio de energía?", "respuesta": "Sí"})
            await self._enviar_audio(audios["serv_ok"])
            await self._terminar_llamada("servicio_activo", EstadoTicket.completado)
        elif digito == "2":
            self.session.respuestas.append({"pregunta": "¿Cuenta con servicio de energía?", "respuesta": "No"})
            self.session.paso_actual = 3
            self.session.historial.append({"role": "assistant", "content": settings.TEXTO_P2})
            await self._enviar_audio(audios["p2"])
            self._reiniciar_timeout()
        else:
            await self._offscript(digito)

    async def _paso_3(self, texto: str) -> None:
        """Sector de la falla (voz libre)"""
        if not self.session.sector:
            self.session.sector = texto
        self.session.historial.append({"role": "user", "content": texto})
        self.session.respuestas.append({"pregunta": "¿Cuál es el sector de la falla?", "respuesta": texto})
        self.session.paso_actual = 4
        self.session.historial.append({"role": "assistant", "content": settings.TEXTO_P3})
        await self._enviar_audio(audios["p3"])
        self._reiniciar_timeout()

    async def _paso_4(self, digito: str) -> None:
        """Tipo de afectación: 1=Total  2=Luz bajita  3=Microcortes"""
        self.session.historial.append({"role": "user", "content": digito})
        if digito in TIPOS_FALLA:
            self.session.tipo_afectacion = TIPOS_FALLA[digito]
            self.session.respuestas.append({
                "pregunta": "¿Qué tipo de afectación presenta?",
                "respuesta": TIPOS_FALLA[digito],
            })
            hora  = datetime.now(COLOMBIA_TZ).hour
            clave = "cierre_dia" if hora < 16 else "cierre_noche"
            texto = settings.TEXTO_CIERRE_DIA if hora < 16 else settings.TEXTO_CIERRE_NOCHE
            self.session.historial.append({"role": "assistant", "content": texto})
            await self._enviar_audio(audios[clave])
            await self._terminar_llamada("completado", EstadoTicket.completado)
        else:
            await self._offscript(digito)

    async def _offscript(self, texto: str) -> None:
        """IA interviene cuando la respuesta no encaja en el flujo."""
        contexto = [{"role": "system", "content": settings.SYSTEM_PROMPT_OFFSCRIPT}]
        contexto += [m for m in self.session.historial if m["role"] != "system"][-6:]
        contexto.append({"role": "user", "content": texto})
        log.info("Offscript activado (paso=%d): %s", self.session.paso_actual, texto[:60])
        respuesta = await self.loop.run_in_executor(None, chat, contexto)
        respuesta = respuesta.replace("[FIN]", "").strip()
        self.session.historial.append({"role": "user", "content": texto})
        self.session.historial.append({"role": "assistant", "content": respuesta})
        audio = await self.loop.run_in_executor(None, text_to_speech, respuesta)
        await self._enviar_audio(audio)
        self._reiniciar_timeout()

    # ── dispatcher de input ───────────────────────────────────────────────────

    async def procesar_input(self, texto: str, es_dtmf: bool = False) -> None:
        if not self.session or self.session.terminada or self.ia_hablando:
            return
        if self.session.paso_actual in PASOS_DTMF and not es_dtmf:
            return
        if self.session.paso_actual == 3 and es_dtmf:
            return
        if not es_dtmf and len(texto.strip()) < 3:
            return

        self.repeticiones = 0
        if self.timeout_task and not self.timeout_task.done():
            self.timeout_task.cancel()

        paso = self.session.paso_actual
        if paso == 2:
            await self._paso_2(texto.strip())
        elif paso == 3:
            await self._paso_3(texto.strip())
        elif paso == 4:
            await self._paso_4(texto.strip())


async def handle_stream(websocket: WebSocket) -> None:
    await CallStreamHandler(websocket).run()
