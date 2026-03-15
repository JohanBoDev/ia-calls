from fastapi import APIRouter, Response

from storage.db_service import get_tickets_con_ultima_llamada, get_chat_ticket
from logger import get_logger

log = get_logger("clients_router")
router = APIRouter(prefix="/api")


@router.get("/clientes")
async def api_clientes():
    return await get_tickets_con_ultima_llamada()


@router.get("/chat/{numero_ticket}")
async def api_chat(numero_ticket: str):
    data = await get_chat_ticket(numero_ticket)
    if not data:
        return Response(status_code=404)
    return data
