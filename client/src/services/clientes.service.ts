import api from '@/lib/axios'

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
  reintento_en:     string | null
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

export interface TicketIn {
  numero_ticket: string
  telefono:      string
  sector:        string
  municipio:     string
}

export async function importarTickets(tickets: TicketIn[]): Promise<{ creados: number; duplicados: number }> {
  const { data } = await api.post('/api/tickets', { tickets })
  return data
}

export async function eliminarTickets(ticket_ids: number[]): Promise<{ eliminados: number }> {
  const { data } = await api.delete('/api/tickets', { data: { ticket_ids } })
  return data
}

export async function getClientes(): Promise<ClienteResumen[]> {
  const { data } = await api.get('/api/clientes')
  return data
}

export async function getClienteChat(numero_ticket: string): Promise<TicketChat> {
  const { data } = await api.get(`/api/chat/${numero_ticket}`)
  return data
}
