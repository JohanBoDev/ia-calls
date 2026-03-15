import azure.cognitiveservices.speech as speechsdk
from config import settings


def _synthesize(ssml: str) -> bytes:
    speech_config = speechsdk.SpeechConfig(
        subscription=settings.AZURE_SPEECH_KEY,
        region=settings.AZURE_SPEECH_REGION,
    )
    speech_config.set_speech_synthesis_output_format(
        speechsdk.SpeechSynthesisOutputFormat.Raw8Khz8BitMonoMULaw
    )
    synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=None)
    result = synthesizer.speak_ssml_async(ssml).get()

    if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        return result.audio_data

    details = ""
    if result.cancellation_details:
        details = result.cancellation_details.error_details
    raise RuntimeError(f"Azure TTS error: {result.reason} — {details}")


def text_to_speech(text: str) -> bytes:
    ssml = f"""<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="es-CO">
  <voice name="{settings.AZURE_VOICE_NAME}">
    <prosody rate="-10%">{text}</prosody>
  </voice>
</speak>"""
    return _synthesize(ssml)


def text_to_speech_dtmf(text: str, opcion_1: str, opcion_2: str, opcion_3: str = None) -> bytes:
    """TTS con pausas claras para opciones de teclado."""
    opciones = (
        f'<break time="400ms"/><emphasis level="strong">Marque</emphasis> '
        f'<say-as interpret-as="cardinal">1</say-as> <break time="200ms"/> {opcion_1}. '
        f'<break time="400ms"/> <say-as interpret-as="cardinal">2</say-as> <break time="200ms"/> {opcion_2}.'
    )
    if opcion_3:
        opciones += (
            f' <break time="400ms"/> O <say-as interpret-as="cardinal">3</say-as>'
            f' <break time="200ms"/> {opcion_3}.'
        )

    ssml = f"""<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="es-CO">
  <voice name="{settings.AZURE_VOICE_NAME}">
    <prosody rate="-10%">{text} {opciones}</prosody>
  </voice>
</speak>"""
    return _synthesize(ssml)
