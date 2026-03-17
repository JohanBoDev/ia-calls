import asyncio
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.audio_service import pregenerar_audios
from services.call_service import limpiar_sesiones_viejas
from routers import calls, stream, clients, health, sesiones, stats, logs, gesi


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await pregenerar_audios()
    asyncio.create_task(limpiar_sesiones_viejas())
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://calls-frontend-enel.s3-website.us-east-2.amazonaws.com", "https://dnkwb11cb5641.cloudfront.net"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(calls.router)
app.include_router(stream.router)
app.include_router(clients.router)
app.include_router(health.router)
app.include_router(sesiones.router)
app.include_router(stats.router)
app.include_router(logs.router)
app.include_router(gesi.router)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
