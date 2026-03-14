import asyncio
import base64
import json
import os

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, Request, WebSocket
from fastapi.responses import Response, FileResponse
from fastapi.staticfiles import StaticFiles
from twilio.twiml.voice_response import Connect, VoiceResponse

from deepgram_client import create_deepgram_connection
from deepseek_client import chat, generar_resumen
from azure_tts_client import text_to_speech
from excel_handler import get_clientes
from chat_handler import guardar_chat, get_all_clients, get_client_chat
from twilio_handler import hacer_llamada, colgar_llamada
from models import CallSession

load_dotenv()

app = FastAPI()

STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "static")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

sessions: dict[str, CallSession] = {}

MAX_INTENTOS = 2
ESPERA_REINTENTO = 3600  # 1 hora

SYSTEM_PROMPT = """Eres un agente virtual de ENEL Colombia, empresa prestadora del servicio de energía eléctrica.
Estás llamando a un cliente que reportó una falla en el suministro eléctrico.

El flujo exacto de la llamada es el siguiente:

1. SALUDO: "Buenos días/tardes, le habla el agente virtual de ENEL Colombia. La llamada es para validar un reporte por falla de energía en el municipio de {municipio}, para el titular {nombre}."
   - Continúa directamente al paso 2 sin preguntar si es el titular.
   - SOLO termina la llamada si la persona dice explícitamente que el número está equivocado o que no se encuentra en la casa para verificar el servicio. En ese caso despídete cortésmente y termina con [FIN].

2. PREGUNTA 1: "¿Cuenta con servicio de energía en este momento?"
   - Si SÍ tiene servicio: agradece, di que el reporte queda cerrado y despídete. Termina con [FIN].
   - Si NO tiene servicio: continúa al paso 3.

3. PREGUNTA 2: "¿Me podría confirmar el sector de la falla? Municipio y vereda o barrio."
   - Escucha y registra la respuesta. Luego continúa al paso 4.

4. PREGUNTA 3: "¿Qué tipo de afectación presenta? ¿Falla total, luz bajita o microcortes?"
   - Escucha la respuesta. Luego continúa al paso 5.

5. CIERRE: "Entendido. En el transcurso del día un técnico se estará comunicando con usted, en caso de que necesite alguna indicación para llegar al lugar de la falla. Que tenga buen día." Termina con [FIN].

Reglas:
- Sigue el flujo exacto, sin agregar preguntas extra.
- Haz UNA sola pregunta a la vez y espera la respuesta.
- Sé amable, breve y profesional.
- Responde siempre en español colombiano, natural y cálido.
- Cuando termines, incluye exactamente [FIN] al final de tu último mensaje."""


@app.get("/")
async def index():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


@app.get("/api/clientes")
async def api_clientes():
    return get_all_clients()


@app.get("/api/chat/{telefono}")
async def api_chat(telefono: str):
    data = get_client_chat(telefono)
    if not data:
        return Response(status_code=404)
    return data


@app.post("/twiml")
async def twiml(request: Request):
    response = VoiceResponse()
    connect = Connect()
    connect.stream(url=f"wss://{request.headers['host']}/stream")
    response.append(connect)
    return Response(content=str(response), media_type="application/xml")


@app.post("/call-status")
async def call_status(request: Request):
    form = await request.form()
    call_sid = form.get("CallSid")
    status = form.get("CallStatus")

    if status in ("completed", "failed", "busy", "no-answer") and call_sid in sessions:
        session = sessions[call_sid]
        if session.historial and not session.terminada:
            resumen = generar_resumen(session.historial)
            guardar_chat(session.cliente, session.historial, resumen)

        if status in ("busy", "no-answer") and session.intentos < MAX_INTENTOS:
            asyncio.create_task(_reintento(session))
        else:
            del sessions[call_sid]

    return Response(status_code=200)


async def _reintento(session: CallSession):
    await asyncio.sleep(ESPERA_REINTENTO)
    telefono = str(session.cliente.get("telefono"))
    nuevo_sid = hacer_llamada(telefono)
    sessions[nuevo_sid] = CallSession(
        call_sid=nuevo_sid,
        cliente=session.cliente,
        intentos=session.intentos + 1,
    )
    del sessions[session.call_sid]

    return Response(status_code=200)


@app.websocket("/stream")
async def stream(websocket: WebSocket):
    await websocket.accept()
    session: CallSession = None
    dg_conn = None
    stream_sid = None
    loop = asyncio.get_event_loop()
    ia_hablando = False

    async def procesar_transcript(texto: str):
        nonlocal ia_hablando

        if not session or session.terminada or len(texto.strip()) < 3:
            return

        # Interrupción: el cliente habla mientras la IA habla
        if ia_hablando:
            ia_hablando = False
            await websocket.send_text(json.dumps({
                "event": "clear",
                "streamSid": stream_sid
            }))

        session.historial.append({"role": "user", "content": texto})
        respuesta_ia = chat(session.historial)
        session.historial.append({"role": "assistant", "content": respuesta_ia})

        terminar = "[FIN]" in respuesta_ia
        texto_limpio = respuesta_ia.replace("[FIN]", "").strip()
        session.historial[-1]["content"] = texto_limpio
        session.ultima_pregunta = texto_limpio

        async def hablar_y_esperar():
            nonlocal ia_hablando
            ia_hablando = True
            audio = text_to_speech(texto_limpio)
            audio_b64 = base64.b64encode(audio).decode("utf-8")
            await websocket.send_text(json.dumps({
                "event": "media",
                "streamSid": stream_sid,
                "media": {"payload": audio_b64}
            }))
            duracion_estimada = len(audio) / 8000
            await asyncio.sleep(duracion_estimada + 0.5)
            ia_hablando = False

            if terminar:
                session.terminada = True
                resumen = generar_resumen(session.historial)
                guardar_chat(session.cliente, session.historial, resumen)
                colgar_llamada(session.call_sid)

        asyncio.create_task(hablar_y_esperar())

    try:
        async for message in websocket.iter_text():
            data = json.loads(message)
            event = data.get("event")

            if event == "start":
                stream_sid = data["start"]["streamSid"]
                call_sid = data["start"]["callSid"]
                session = sessions.get(call_sid)
                if not session:
                    break

                dg_conn = create_deepgram_connection(
                    lambda t: asyncio.run_coroutine_threadsafe(
                        procesar_transcript(t), loop
                    )
                )
                session.ultima_pregunta = session.saludo_texto

                async def enviar_saludo():
                    nonlocal ia_hablando
                    ia_hablando = True
                    audio_b64 = base64.b64encode(session.saludo_audio).decode("utf-8")
                    await websocket.send_text(json.dumps({
                        "event": "media",
                        "streamSid": stream_sid,
                        "media": {"payload": audio_b64}
                    }))
                    duracion_estimada = len(session.saludo_audio) / 8000
                    await asyncio.sleep(duracion_estimada + 0.5)
                    ia_hablando = False

                asyncio.create_task(enviar_saludo())

            elif event == "media" and dg_conn:
                payload = data["media"]["payload"]
                audio_bytes = base64.b64decode(payload)
                try:
                    dg_conn.send(audio_bytes)
                except Exception:
                    pass

            elif event == "stop":
                break

    finally:
        if dg_conn:
            dg_conn.finish()


@app.post("/iniciar-llamadas")
async def iniciar_llamadas():
    clientes = get_clientes()
    resultados = []

    for cliente in clientes:
        telefono = cliente.get("telefono")
        if not telefono:
            continue

        nombre = cliente.get('nombre', 'cliente')
        municipio = cliente.get('municipio', cliente.get('ubicacion', 'su municipio'))
        historial_temp = [{
            "role": "system",
            "content": SYSTEM_PROMPT.replace("{nombre}", nombre).replace("{municipio}", municipio) +
                       f"\nNombre del cliente: {nombre}\nMunicipio: {municipio}"
        }]
        saludo_texto = chat(historial_temp + [
            {"role": "user", "content": "inicia la conversación con un saludo y tu primera pregunta"}
        ])
        saludo_audio = text_to_speech(saludo_texto.replace("[FIN]", "").strip())
        historial_temp.append({"role": "assistant", "content": saludo_texto.replace("[FIN]", "").strip()})

        call_sid = hacer_llamada(str(telefono))
        sessions[call_sid] = CallSession(
            call_sid=call_sid,
            cliente=cliente,
            historial=historial_temp,
            saludo_audio=saludo_audio,
            saludo_texto=saludo_texto.replace("[FIN]", "").strip(),
        )
        resultados.append({
            "cliente": cliente.get("nombre"),
            "call_sid": call_sid
        })
        await asyncio.sleep(2)

    return {"llamadas_iniciadas": len(resultados), "detalle": resultados}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
