from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.log_broadcaster import manager
from logger import get_logger

log = get_logger("logs_ws")
router = APIRouter()


@router.websocket("/api/logs")
async def logs_ws(websocket: WebSocket):
    await manager.connect(websocket)
    log.info("Cliente conectado al stream de logs")
    try:
        while True:
            await websocket.receive_text()  # mantiene la conexión abierta
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        log.info("Cliente desconectado del stream de logs")
