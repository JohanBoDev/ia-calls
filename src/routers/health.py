"""
Health check endpoint.
GET /health → estado de la app y servicios externos.
"""
import asyncio
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from config import settings
from storage.session_store import sessions
from services.audio_service import audios
from logger import get_logger

log = get_logger("health")

router = APIRouter()


def _check_twilio() -> dict:
    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.api.accounts(settings.TWILIO_ACCOUNT_SID).fetch()
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


def _check_deepseek() -> dict:
    if not settings.DEEPSEEK_API_KEY:
        return {"status": "error", "detail": "DEEPSEEK_API_KEY no configurada"}
    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.DEEPSEEK_API_KEY, base_url="https://api.deepseek.com")
        # Llamada mínima — sin generar tokens reales
        client.models.list()
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


def _check_azure() -> dict:
    if not settings.AZURE_SPEECH_KEY or not settings.AZURE_SPEECH_REGION:
        return {"status": "error", "detail": "Credenciales Azure no configuradas"}
    return {"status": "ok", "region": settings.AZURE_SPEECH_REGION, "voice": settings.AZURE_VOICE_NAME}


def _check_deepgram() -> dict:
    if not settings.DEEPGRAM_API_KEY:
        return {"status": "error", "detail": "DEEPGRAM_API_KEY no configurada"}
    return {"status": "ok"}


@router.get("/health")
async def health():
    loop = asyncio.get_event_loop()

    twilio_result, deepseek_result = await asyncio.gather(
        loop.run_in_executor(None, _check_twilio),
        loop.run_in_executor(None, _check_deepseek),
    )

    checks = {
        "twilio":   twilio_result,
        "azure_tts": _check_azure(),
        "deepgram": _check_deepgram(),
        "deepseek": deepseek_result,
    }

    app_status = {
        "sesiones_activas": len(sessions),
        "audios_precargados": len(audios),
    }

    all_ok = all(v["status"] == "ok" for v in checks.values())
    status_code = 200 if all_ok else 503

    log.info("Health check — ok=%s sesiones=%d", all_ok, len(sessions))

    return JSONResponse(
        status_code=status_code,
        content={
            "status": "ok" if all_ok else "degraded",
            "app": app_status,
            "servicios": checks,
        },
    )
