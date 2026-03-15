from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from storage.session_store import sessions, session_lock
from storage.db_service import finalizar_llamada
from db_models import EstadoTicket
from clients.twilio import colgar_llamada
from logger import get_logger

log = get_logger("sesiones")
router = APIRouter(prefix="/api")


@router.get("/sesiones")
async def get_sesiones():
    async with session_lock:
        return [
            {
                "call_sid":        s.call_sid,
                "numero_ticket":   s.numero_ticket,
                "telefono":        s.telefono,
                "municipio":       s.municipio,
                "paso_actual":     s.paso_actual,
                "terminada":       s.terminada,
                "intentos":        s.intentos,
                "sector":          s.sector,
                "tipo_afectacion": s.tipo_afectacion,
            }
            for s in sessions.values()
        ]


@router.delete("/sesiones/{call_sid}")
async def cancelar_sesion(call_sid: str):
    async with session_lock:
        session = sessions.get(call_sid)

    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")

    session.terminada = True

    if session.llamada_id:
        await finalizar_llamada(
            llamada_id=session.llamada_id,
            ticket_id=session.ticket_id,
            resultado="cancelada_manualmente",
            estado_ticket=EstadoTicket.fallido,
            sector=session.sector,
            tipo_afectacion=session.tipo_afectacion,
            historial=session.historial,
            respuestas=session.respuestas,
        )

    try:
        colgar_llamada(call_sid)
        log.info("Sesión %s cancelada manualmente", call_sid)
    except Exception as e:
        log.error("Error al colgar %s: %s", call_sid, e)

    async with session_lock:
        sessions.pop(call_sid, None)

    return Response(status_code=204)
