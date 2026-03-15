import threading
from deepgram import DeepgramClient, LiveTranscriptionEvents, LiveOptions
from config import settings

KEEPALIVE_INTERVAL = 8  # segundos


def create_deepgram_connection(on_transcript):
    dg = DeepgramClient(settings.DEEPGRAM_API_KEY)
    conn = dg.listen.websocket.v("1")
    buffer = []
    _stop = threading.Event()

    def on_message(*args, **kwargs):
        result = kwargs.get("result") or (args[1] if len(args) > 1 else None)
        if not result or not result.is_final:
            return
        transcript = result.channel.alternatives[0].transcript
        if transcript.strip():
            buffer.append(transcript.strip())

    def on_utterance_end(*args, **kwargs):
        if buffer:
            texto = " ".join(buffer)
            buffer.clear()
            on_transcript(texto)

    def _keepalive_loop():
        while not _stop.wait(KEEPALIVE_INTERVAL):
            try:
                conn.keep_alive()
            except Exception:
                break

    conn.on(LiveTranscriptionEvents.Transcript, on_message)
    conn.on(LiveTranscriptionEvents.UtteranceEnd, on_utterance_end)

    options = LiveOptions(
        model="nova-2",
        language="es",
        encoding="mulaw",
        sample_rate=8000,
        endpointing=800,
        interim_results=True,
        utterance_end_ms="2500",
    )
    conn.start(options)

    threading.Thread(target=_keepalive_loop, daemon=True).start()

    original_finish = conn.finish

    def finish_con_cleanup():
        _stop.set()
        original_finish()

    conn.finish = finish_con_cleanup
    return conn
