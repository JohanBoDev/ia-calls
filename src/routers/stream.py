from fastapi import APIRouter, WebSocket
from services.stream_service import handle_stream

router = APIRouter()


@router.websocket("/stream")
async def stream(websocket: WebSocket):
    await handle_stream(websocket)
