import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cargarDesdeGesi,
  departamentosApi, estadosApi, origenesApi, tiposApi, municipiosApi,
} from '@/services/gesi.service'

function makeCatalogHooks(key: string, api: { get: () => Promise<unknown[]>; add: (n: string) => Promise<unknown>; toggle: (id: number, activo: boolean) => Promise<unknown>; delete: (id: number) => Promise<void> }) {
  function useList() {
    return useQuery({ queryKey: ['gesi', key], queryFn: api.get })
  }
  function useAdd() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (nombre: string) => api.add(nombre),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['gesi', key] }),
    })
  }
  function useToggle() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: ({ id, activo }: { id: number; activo: boolean }) => api.toggle(id, activo),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['gesi', key] }),
    })
  }
  function useDelete() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (id: number) => api.delete(id),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['gesi', key] }),
    })
  }
  return { useList, useAdd, useToggle, useDelete }
}

export const depHooks  = makeCatalogHooks('departamentos', departamentosApi as never)
export const estHooks  = makeCatalogHooks('estados', estadosApi as never)
export const oriHooks  = makeCatalogHooks('origenes', origenesApi as never)
export const tipHooks  = makeCatalogHooks('tipos', tiposApi as never)
export const munHooks  = makeCatalogHooks('municipios', municipiosApi as never)

// Legacy exports used by GesiPage
export const useDepartamentosQuery        = depHooks.useList
export const useToggleDepartamentoMutation = depHooks.useToggle
export const useEstadosQuery              = estHooks.useList
export const useToggleEstadoMutation      = estHooks.useToggle
export const useOrigenesQuery             = oriHooks.useList
export const useToggleOrigenMutation      = oriHooks.useToggle
export const useTiposQuery                = tipHooks.useList
export const useToggleTipoMutation        = tipHooks.useToggle
export const useMunicipiosGesiQuery       = munHooks.useList
export const useAddMunicipioMutation      = munHooks.useAdd
export const useToggleMunicipioMutation   = munHooks.useToggle
export const useDeleteMunicipioMutation   = munHooks.useDelete

export function useCargarGesiMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params?: { fecha_desde?: string; fecha_hasta?: string }) =>
      cargarDesdeGesi(params),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes'] }),
  })
}
