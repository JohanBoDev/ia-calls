import asyncio
from datetime import datetime, timezone, timedelta

from config import settings
from models import CallSession
from clients.twilio import hacer_llamada, colgar_llamada
from clients.azure_tts import text_to_speech
from storage.session_store import sessions, session_lock
from storage.db_service import (
    get_tickets_pendientes,
    get_tickets_by_ids,
    crear_llamada,
    finalizar_llamada,
    actualizar_estado_ticket,
)
from db_models import EstadoTicket
from logger import get_logger

log = get_logger("call_service")

COLOMBIA_TZ = timezone(timedelta(hours=-5))


def _saludo_texto(municipio: str) -> str:
    hora = datetime.now(COLOMBIA_TZ).hour
    if hora < 12:
        saludo_hora = "Buenos días"
    elif hora < 19:
        saludo_hora = "Buenas tardes"
    else:
        saludo_hora = "Buenas noches"

    return (
        f"{saludo_hora}. Le habla el sistema de atención virtual de ENEL Colombia. "
        f"Lo contactamos por el reporte de falla eléctrica registrado en {municipio}. "
        f"Esta llamada es breve. En algunas preguntas use su teclado y en otras puede hablar con normalidad."
    )


async def llamar_tickets(ticket_ids: list[int]) -> dict:
    """Llama tickets específicos por ID, sin importar su estado actual."""
    tickets = await get_tickets_by_ids(ticket_ids)
    return await _ejecutar_llamadas(tickets)


async def iniciar_llamadas() -> dict:
    """Llama todos los tickets pendientes."""
    tickets = await get_tickets_pendientes()
    return await _ejecutar_llamadas(tickets)


async def _ejecutar_llamadas(tickets: list) -> dict:
    resultados = []
    loop = asyncio.get_event_loop()

    async with session_lock:
        telefonos_activos = {s.telefono for s in sessions.values() if not s.terminada}

    for ticket in tickets:
        telefono = ticket.telefono
        if telefono in telefonos_activos:
            log.info("Omitiendo %s — ya tiene llamada activa", telefono)
            resultados.append({"ticket": ticket.numero_ticket, "omitido": "ya_tiene_llamada_activa"})
            continue

        texto = _saludo_texto(ticket.municipio)
        audio = await loop.run_in_executor(None, text_to_speech, texto)

        historial_inicial = [
            {"role": "assistant", "content": texto},
            {"role": "assistant", "content": settings.TEXTO_P1},
        ]

        try:
            call_sid = hacer_llamada(telefono)
        except Exception as e:
            log.error("Error al llamar a %s: %s", telefono, e)
            resultados.append({"ticket": ticket.numero_ticket, "error": str(e)})
            continue

        llamada_id = await crear_llamada(ticket.id, call_sid)

        async with session_lock:
            sessions[call_sid] = CallSession(
                call_sid=call_sid,
                ticket_id=ticket.id,
                numero_ticket=ticket.numero_ticket,
                telefono=telefono,
                municipio=ticket.municipio,
                sector=ticket.sector or "",
                llamada_id=llamada_id,
                historial=historial_inicial,
                saludo_audio=audio,
                saludo_texto=texto,
                paso_actual=2,
            )

        log.info("Llamada iniciada a %s (ticket=%s) — sid=%s", telefono, ticket.numero_ticket, call_sid)
        resultados.append({"ticket": ticket.numero_ticket, "call_sid": call_sid})
        await asyncio.sleep(2)

    return {"llamadas_iniciadas": len(resultados), "detalle": resultados}


async def llamar_tickets(ticket_ids: list[int]) -> dict:
    """Llama tickets específicos por ID, sin importar su estado actual."""
    tickets = await get_tickets_by_ids(ticket_ids)
    return await _ejecutar_llamadas(tickets)


async def iniciar_llamadas() -> dict:
    tickets = await get_tickets_pendientes()
    return await _ejecutar_llamadas(tickets)


async def manejar_amd(call_sid: str, answered_by: str) -> None:
    maquinas = {"machine_start", "machine_end_beep", "machine_end_silence", "fax"}
    if answered_by not in maquinas:
        return

    log.info("AMD detectó máquina (%s) en %s — colgando", answered_by, call_sid)
    async with session_lock:
        session = sessions.get(call_sid)
        if session:
            session.terminada = True

    if session and session.llamada_id:
        await finalizar_llamada(
            llamada_id=session.llamada_id,
            ticket_id=session.ticket_id,
            resultado="buzon_de_voz",
            estado_ticket=EstadoTicket.no_contesto,
            sector="",
            tipo_afectacion="",
            historial=[],
            respuestas=[],
        )

    try:
        colgar_llamada(call_sid)
    except Exception as e:
        log.error("Error al colgar llamada AMD %s: %s", call_sid, e)


async def manejar_call_status(call_sid: str, status: str) -> None:
    async with session_lock:
        session = sessions.get(call_sid)

    if not session:
        return

    log.info("Estado de llamada %s: %s", call_sid, status)

    if status == "completed" and not session.terminada:
        if session.llamada_id:
            await finalizar_llamada(
                llamada_id=session.llamada_id,
                ticket_id=session.ticket_id,
                resultado="cliente_colgo",
                estado_ticket=EstadoTicket.completado,
                sector=session.sector,
                tipo_afectacion=session.tipo_afectacion,
                historial=session.historial,
                respuestas=session.respuestas,
            )
        async with session_lock:
            sessions.pop(call_sid, None)
        return

    if status == "failed":
        log.warning("Llamada fallida para %s", call_sid)
        if session.llamada_id:
            await finalizar_llamada(
                llamada_id=session.llamada_id,
                ticket_id=session.ticket_id,
                resultado="error_tecnico",
                estado_ticket=EstadoTicket.fallido,
                sector="",
                tipo_afectacion="",
                historial=[],
                respuestas=[],
            )
        async with session_lock:
            sessions.pop(call_sid, None)
        return

    if status in ("busy", "no-answer"):
        if session.intentos < settings.MAX_INTENTOS:
            log.info("Programando reintento para %s (intento %d)", call_sid, session.intentos + 1)
            asyncio.create_task(_reintento(session, status))
        else:
            log.info("Máximo de intentos alcanzado para %s", call_sid)
            if session.llamada_id:
                await finalizar_llamada(
                    llamada_id=session.llamada_id,
                    ticket_id=session.ticket_id,
                    resultado=f"nunca_contesto_{session.intentos}_intentos",
                    estado_ticket=EstadoTicket.no_contesto,
                    sector="",
                    tipo_afectacion="",
                    historial=[],
                    respuestas=[],
                )
            async with session_lock:
                sessions.pop(call_sid, None)


async def _reintento(session: CallSession, motivo: str) -> None:
    await asyncio.sleep(settings.ESPERA_REINTENTO)
    await actualizar_estado_ticket(session.ticket_id, EstadoTicket.reintento_pendiente)

    log.info("Reintentando llamada a %s (motivo: %s)", session.telefono, motivo)
    try:
        nuevo_sid = hacer_llamada(session.telefono)
    except Exception as e:
        log.error("Error al reintentar llamada a %s: %s", session.telefono, e)
        await actualizar_estado_ticket(session.ticket_id, EstadoTicket.fallido)
        async with session_lock:
            sessions.pop(session.call_sid, None)
        return

    nueva_llamada_id = await crear_llamada(session.ticket_id, nuevo_sid)

    async with session_lock:
        sessions[nuevo_sid] = CallSession(
            call_sid=nuevo_sid,
            ticket_id=session.ticket_id,
            numero_ticket=session.numero_ticket,
            telefono=session.telefono,
            municipio=session.municipio,
            llamada_id=nueva_llamada_id,
            intentos=session.intentos + 1,
        )
        sessions.pop(session.call_sid, None)

    log.info("Reintento exitoso — nuevo sid=%s", nuevo_sid)
