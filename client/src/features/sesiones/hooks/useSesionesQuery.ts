import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSesiones, cancelarSesion } from '@/services/sesiones.service'
import { toast } from 'sonner'

export const SESIONES_KEY = ['sesiones'] as const

export function useSesionesQuery() {
  return useQuery({
    queryKey: SESIONES_KEY,
    queryFn: getSesiones,
    refetchInterval: 5_000,
  })
}

export function useCancelarSesionMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: cancelarSesion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SESIONES_KEY })
      toast.success('Llamada cancelada')
    },
    onError: () => toast.error('Error al cancelar la llamada'),
  })
}
