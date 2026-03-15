import asyncio
from config import settings
from clients.azure_tts import text_to_speech, text_to_speech_dtmf

# Cache de audios pre-generados al arrancar
audios: dict[str, bytes] = {}


async def pregenerar_audios() -> None:
    """Genera todos los audios fijos al arrancar el servidor para eliminar latencia."""
    loop = asyncio.get_event_loop()

    # Preguntas de teclado: con pausas y énfasis en las opciones
    audios["p1"] = await loop.run_in_executor(
        None, text_to_speech_dtmf,
        "¿Cuenta con servicio de energía en este momento?", "para Sí", "para No", None,
    )
    audios["p3"] = await loop.run_in_executor(
        None, text_to_speech_dtmf,
        "¿Qué tipo de afectación presenta?", "falla total", "luz bajita", "microcortes",
    )

    # Resto de audios normales
    pares = [
        ("p2",           settings.TEXTO_P2),
        ("serv_ok",      settings.TEXTO_SERV_OK),
        ("invalido",     settings.TEXTO_INVALIDO),
        ("silencio",     settings.TEXTO_SILENCIO),
        ("cierre_dia",   settings.TEXTO_CIERRE_DIA),
        ("cierre_noche", settings.TEXTO_CIERRE_NOCHE),
    ]
    for key, texto in pares:
        audios[key] = await loop.run_in_executor(None, text_to_speech, texto)
