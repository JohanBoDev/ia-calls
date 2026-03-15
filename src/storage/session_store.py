import asyncio
from models import CallSession

sessions: dict[str, CallSession] = {}
session_lock = asyncio.Lock()
