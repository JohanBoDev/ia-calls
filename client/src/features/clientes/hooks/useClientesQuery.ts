import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getClientes, getClienteChat, importarTickets, type TicketIn } from '@/services/clientes.service'

export const CLIENTES_KEY = ['clientes'] as const

export function useClientesQuery() {
  return useQuery({
    queryKey: CLIENTES_KEY,
    queryFn: getClientes,
  })
}

export function useImportarTicketsMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tickets: TicketIn[]) => importarTickets(tickets),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTES_KEY }),
  })
}

export function useClienteChatQuery(numero_ticket: string) {
  return useQuery({
    queryKey: [...CLIENTES_KEY, numero_ticket],
    queryFn: () => getClienteChat(numero_ticket),
    enabled: !!numero_ticket,
  })
}
