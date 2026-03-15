import api from '@/lib/axios'

export interface IniciarLlamadasResult {
  llamadas_iniciadas: number
  detalle: Record<string, unknown>[]
}

export interface HealthResult {
  status: 'ok' | 'degraded'
  app: {
    sesiones_activas: number
    audios_precargados: number
  }
  servicios: Record<string, { status: 'ok' | 'error'; detail?: string }>
}

export async function iniciarLlamadas(): Promise<IniciarLlamadasResult> {
  const { data } = await api.post('/iniciar-llamadas')
  return data
}

export async function llamarSeleccion(ticket_ids: number[]): Promise<IniciarLlamadasResult> {
  const { data } = await api.post('/api/tickets/llamar', { ticket_ids })
  return data
}

export async function getHealth(): Promise<HealthResult> {
  const { data } = await api.get('/health')
  return data
}
