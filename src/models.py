from dataclasses import dataclass, field


@dataclass
class CallSession:
    call_sid:        str
    ticket_id:       int
    numero_ticket:   str
    telefono:        str
    municipio:       str
    llamada_id:      int | None       = None   # FK a llamadas, se asigna al iniciar stream
    historial:       list[dict]       = field(default_factory=list)
    respuestas:      list[dict]       = field(default_factory=list)  # respuestas estructuradas
    ultima_pregunta: str              = ""
    terminada:       bool             = False
    intentos:        int              = 1
    saludo_audio:    bytes            = field(default=None)
    saludo_texto:    str              = ""
    paso_actual:     int              = 2      # 2=¿tiene servicio? 3=¿sector? 4=¿tipo falla?
    sector:          str              = ""
    tipo_afectacion: str              = ""
