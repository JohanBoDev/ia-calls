
from dataclasses import dataclass, field

@dataclass
class CallSession:
    call_sid: str
    cliente: dict
    historial: list[dict] = field(default_factory=list)
    respuestas: list[dict] = field(default_factory=list)
    ultima_pregunta: str = ""
    terminada: bool = False
    intentos: int = 1
    saludo_audio: bytes = field(default=None)
    saludo_texto: str = ""