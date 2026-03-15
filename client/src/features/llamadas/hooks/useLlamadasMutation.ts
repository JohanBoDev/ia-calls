import { useMutation, useQueryClient } from '@tanstack/react-query'
import { iniciarLlamadas, llamarSeleccion } from '@/services/llamadas.service'
import { toast } from 'sonner'
import { CLIENTES_KEY } from '@/features/clientes/hooks/useClientesQuery'

export function useIniciarLlamadasMutation() {
  return useMutation({
    mutationFn: iniciarLlamadas,
    onSuccess: (data) => {
      toast.success(`${data.llamadas_iniciadas} llamadas iniciadas correctamente`)
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Error al iniciar llamadas')
    },
  })
}

export function useLlamarSeleccionMutation(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: llamarSeleccion,
    onSuccess: (data) => {
      toast.success(`${data.llamadas_iniciadas} llamada(s) iniciada(s)`)
      qc.invalidateQueries({ queryKey: CLIENTES_KEY })
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Error al iniciar llamadas')
    },
  })
}
