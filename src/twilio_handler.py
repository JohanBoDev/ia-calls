
from twilio.rest import Client
from dotenv import load_dotenv
import os

load_dotenv()

client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))

def colgar_llamada(call_sid: str):
    client.calls(call_sid).update(status="completed")

def hacer_llamada(telefono: str) -> str:
    call = client.calls.create(
        to=telefono,
        from_=os.getenv("TWILIO_PHONE_NUMBER"),
        url=f"{os.getenv('BASE_URL')}/twiml",
        status_callback=f"{os.getenv('BASE_URL')}/call-status",
        status_callback_method="POST",
    )
    return call.sid