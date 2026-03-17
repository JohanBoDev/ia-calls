from dotenv import load_dotenv
import os

load_dotenv()


class Settings:
    # Twilio
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str  = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_NUMBER: str = os.getenv("TWILIO_PHONE_NUMBER", "")

    # Deepgram
    DEEPGRAM_API_KEY: str = os.getenv("DEEPGRAM_API_KEY", "")

    # Azure TTS
    AZURE_SPEECH_KEY: str    = os.getenv("AZURE_SPEECH_KEY", "")
    AZURE_SPEECH_REGION: str = os.getenv("AZURE_SPEECH_REGION", "")
    AZURE_VOICE_NAME: str    = "es-CO-GonzaloNeural"

    # DeepSeek
    DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "")

    # App
    BASE_URL: str = os.getenv("BASE_URL", "")

    # GESI
    GESI_URL: str           = os.getenv("GESI_URL", "")
    GESI_USER: str          = os.getenv("GESI_USER", "")
    GESI_PASSWORD: str      = os.getenv("GESI_PASSWORD", "")
    GESI_TOKEN_SECURITY: str = os.getenv("GESI_TOKEN_SECURITY", "")
    GESI_COOKIE: str        = os.getenv("GESI_COOKIE", "")
    GESI_DTPC: str          = os.getenv("GESI_DTPC", "")

    # Base de datos
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/ai_calls")

    # Llamadas
    MAX_INTENTOS: int      = 2
    ESPERA_REINTENTO: int  = 3600   # segundos
    TIMEOUT_SILENCIO: int  = 15     # segundos sin respuesta
    MAX_REPETICIONES: int  = 2      # veces que repite pregunta antes de colgar
    SESSION_TIMEOUT: int   = 300    # segundos máximos que puede vivir una sesión (5 min)

    # Textos fijos del flujo
    TEXTO_P1        = "¿Cuenta con servicio de energía en este momento? Marque uno para Sí o dos para No."
    TEXTO_P2        = "¿Cuál es el sector de la falla? Díganos el barrio o vereda, hablando con calma."
    TEXTO_P3        = "¿Qué tipo de afectación presenta? Marque uno para falla total, dos para luz bajita, o tres para microcortes."
    TEXTO_SERV_OK      = "Qué buena noticia. El reporte queda cerrado. Que tenga buen día."
    TEXTO_INVALIDO     = "Por favor responda marcando una tecla en su teclado."
    TEXTO_SILENCIO     = "No hemos recibido respuesta. Gracias por su tiempo. Que tenga buen día."
    TEXTO_CIERRE_DIA   = "Perfecto, gracias por su colaboración. Hoy un técnico de ENEL Colombia se comunicará con usted. Que tenga buen día."
    TEXTO_CIERRE_NOCHE = "Perfecto, gracias por su colaboración. Mañana un técnico de ENEL Colombia se comunicará con usted. Que tenga buena noche."

    SYSTEM_PROMPT_OFFSCRIPT = (
        "Eres un agente virtual de ENEL Colombia atendiendo una llamada sobre una falla eléctrica. "
        "El cliente ha dado una respuesta inesperada. Responde de forma breve, amable y en español colombiano. "
        "Redirige la conversación al flujo principal: verificar si tiene servicio, confirmar sector y tipo de falla. "
        "Haz UNA sola pregunta o aclaración y espera la respuesta. Máximo 2 oraciones."
    )


settings = Settings()
