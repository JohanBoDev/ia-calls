from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel

from storage.db_service import get_tickets_con_ultima_llamada, get_chat_ticket, crear_tickets
from logger import get_logger

log = get_logger("clients_router")
router = APIRouter(prefix="/api")


class TicketIn(BaseModel):
    numero_ticket: str
    telefono:      str
    sector:        str
    municipio:     str


class TicketsImportBody(BaseModel):
    tickets: list[TicketIn]


@router.get("/clientes")
async def api_clientes():
    return await get_tickets_con_ultima_llamada()


@router.post("/tickets")
async def api_crear_tickets(body: TicketsImportBody):
    resultado = await crear_tickets(body.tickets)
    return resultado


@router.get("/chat/{numero_ticket}")
async def api_chat(numero_ticket: str):
    data = await get_chat_ticket(numero_ticket)
    if not data:
        return Response(status_code=404)
    return data
