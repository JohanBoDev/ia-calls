from twilio.rest import Client
from config import settings

_client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)


def hacer_llamada(telefono: str) -> str:
    call = _client.calls.create(
        to=telefono,
        from_=settings.TWILIO_PHONE_NUMBER,
        url=f"{settings.BASE_URL}/twiml",
        status_callback=f"{settings.BASE_URL}/call-status",
        status_callback_method="POST",
        status_callback_event=["initiated", "ringing", "answered", "completed"],
        machine_detection="Enable",
        async_amd=True,
        async_amd_status_callback=f"{settings.BASE_URL}/amd-status",
        async_amd_status_callback_method="POST",
    )
    return call.sid


def colgar_llamada(call_sid: str) -> None:
    _client.calls(call_sid).update(status="completed")
