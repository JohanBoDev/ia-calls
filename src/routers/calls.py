from fastapi import APIRouter, Request
from fastapi.responses import Response
from pydantic import BaseModel
from twilio.twiml.voice_response import Connect, VoiceResponse

from services.call_service import iniciar_llamadas, llamar_tickets, manejar_amd, manejar_call_status

router = APIRouter()


class LlamarSeleccionBody(BaseModel):
    ticket_ids: list[int]


@router.post("/twiml")
async def twiml(request: Request):
    response = VoiceResponse()
    connect  = Connect()
    connect.stream(url=f"wss://{request.headers['host']}/stream")
    response.append(connect)
    return Response(content=str(response), media_type="application/xml")


@router.post("/amd-status")
async def amd_status(request: Request):
    form        = await request.form()
    call_sid    = form.get("CallSid")
    answered_by = form.get("AnsweredBy")
    await manejar_amd(call_sid, answered_by)
    return Response(status_code=200)


@router.post("/call-status")
async def call_status(request: Request):
    form     = await request.form()
    call_sid = form.get("CallSid")
    status   = form.get("CallStatus")
    await manejar_call_status(call_sid, status)
    return Response(status_code=200)


@router.post("/iniciar-llamadas")
async def endpoint_iniciar_llamadas():
    return await iniciar_llamadas()


@router.post("/api/tickets/llamar")
async def endpoint_llamar_seleccion(body: LlamarSeleccionBody):
    """Llama tickets específicos por ID (manual, sin filtro de estado)."""
    return await llamar_tickets(body.ticket_ids)
