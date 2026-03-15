import api from '@/lib/axios'

export interface StatsResult {
  total_tickets:     number
  total_llamadas:    number
  completadas:       number
  no_contesto:       number
  pct_completada:    number
  distribucion_tipo: { tipo: string; cantidad: number }[]
}

export async function getStats(): Promise<StatsResult> {
  const { data } = await api.get('/api/stats')
  return data
}
