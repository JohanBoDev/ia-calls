import api from '@/lib/axios'

export interface SesionActiva {
  call_sid:        string
  numero_ticket:   string
  telefono:        string
  municipio:       string
  paso_actual:     number
  terminada:       boolean
  intentos:        number
  sector:          string
  tipo_afectacion: string
}

export async function getSesiones(): Promise<SesionActiva[]> {
  const { data } = await api.get('/api/sesiones')
  return data
}

export async function cancelarSesion(call_sid: string): Promise<void> {
  await api.delete(`/api/sesiones/${call_sid}`)
}
