from deepgram import DeepgramClient, LiveTranscriptionEvents, LiveOptions
from dotenv import load_dotenv
import os

load_dotenv()

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

def create_deepgram_connection(on_transcript):
    dg = DeepgramClient(DEEPGRAM_API_KEY)
    conn = dg.listen.websocket.v("1")
    buffer = []

    def on_message(*args, **kwargs):
        result = kwargs.get("result") or (args[1] if len(args) > 1 else None)
        if not result or not result.is_final:
            return
        transcript = result.channel.alternatives[0].transcript
        if transcript.strip():
            buffer.append(transcript.strip())

    def on_utterance_end(*args, **kwargs):
        if buffer:
            texto_completo = " ".join(buffer)
            buffer.clear()
            on_transcript(texto_completo)

    conn.on(LiveTranscriptionEvents.Transcript, on_message)
    conn.on(LiveTranscriptionEvents.UtteranceEnd, on_utterance_end)

    options = LiveOptions(
        model="nova-2",
        language="es",
        encoding="mulaw",
        sample_rate=8000,
        endpointing=500,
        interim_results=True,
        utterance_end_ms="1500",
    )

    conn.start(options)
    return conn