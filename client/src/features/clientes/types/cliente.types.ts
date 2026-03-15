export interface ClienteResumen {
  ticket_id:        number
  numero_ticket:    string
  telefono:         string
  sector:           string
  municipio:        string
  estado:           string
  intentos:         number
  creado_en:        string | null
  ultima_llamada:   string | null
  ultimo_resultado: string | null
}

export interface Mensaje {
  role: 'assistant' | 'user' | 'system'
  content: string
}

export interface RespuestaEstructurada {
  pregunta:  string
  respuesta: string
}

export interface Llamada {
  llamada_id:   number
  call_sid:     string | null
  iniciada_en:  string | null
  terminada_en: string | null
  resultado:    string | null
  mensajes:     Mensaje[]
  respuestas:   RespuestaEstructurada[]
}

export interface TicketChat {
  numero_ticket: string
  telefono:      string
  sector:        string
  municipio:     string
  estado:        string
  llamadas:      Llamada[]
}
