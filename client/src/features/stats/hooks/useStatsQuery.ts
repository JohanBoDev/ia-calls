import { useQuery } from '@tanstack/react-query'
import { getStats } from '@/services/stats.service'

export function useStatsQuery() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
    refetchInterval: 60_000,
  })
}
