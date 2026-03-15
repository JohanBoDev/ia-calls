"""
Broadcaster de logs via WebSocket.
Cualquier mensaje que llegue al LogBroadcastHandler se reenvía
a todos los clientes WebSocket conectados a /api/logs.
"""
import asyncio
import json
import logging
from datetime import datetime
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._clients: list[WebSocket] = []

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self._clients.append(ws)

    def disconnect(self, ws: WebSocket) -> None:
        self._clients = [c for c in self._clients if c is not ws]

    async def broadcast(self, message: str) -> None:
        dead = []
        for client in self._clients:
            try:
                await client.send_text(message)
            except Exception:
                dead.append(client)
        for d in dead:
            self.disconnect(d)


manager = ConnectionManager()


class LogBroadcastHandler(logging.Handler):
    """Handler que envía cada log al manager WebSocket."""

    def __init__(self) -> None:
        super().__init__()
        self._loop: asyncio.AbstractEventLoop | None = None

    def _get_loop(self) -> asyncio.AbstractEventLoop | None:
        if self._loop and not self._loop.is_closed():
            return self._loop
        try:
            self._loop = asyncio.get_event_loop()
            return self._loop
        except RuntimeError:
            return None

    def emit(self, record: logging.LogRecord) -> None:
        loop = self._get_loop()
        if loop is None or not loop.is_running():
            return
        payload = json.dumps({
            "ts":      datetime.now().strftime("%H:%M:%S"),
            "level":   record.levelname,
            "modulo":  record.name,
            "mensaje": self.format(record),
        })
        asyncio.run_coroutine_threadsafe(manager.broadcast(payload), loop)


# Handler singleton — se registra en logger.py
broadcast_handler = LogBroadcastHandler()
broadcast_handler.setFormatter(logging.Formatter("%(message)s"))
