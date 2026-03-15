import { useQuery } from '@tanstack/react-query'
import { getHealth } from '@/services/llamadas.service'

export function useHealthQuery() {
  return useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 30_000,
  })
}
