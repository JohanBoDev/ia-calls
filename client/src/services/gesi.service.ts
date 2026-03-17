import api from '@/lib/axios'

export interface GesiCatalogItem {
  id: number
  nombre: string
  activo: boolean
}

export interface GesiMunicipioItem {
  id: number
  nombre: string
  activo: boolean
}

export interface CargarTicketsResult {
  total_gesi: number
  creados: number
  actualizados: number
}

export async function cargarDesdeGesi(params?: {
  fecha_desde?: string
  fecha_hasta?: string
}): Promise<CargarTicketsResult> {
  const { data } = await api.post('/api/gesi/cargar', params ?? {})
  return data
}

function makeCatalogApi(path: string) {
  return {
    get: async (): Promise<GesiCatalogItem[]> => (await api.get(path)).data,
    add: async (nombre: string): Promise<GesiCatalogItem> => (await api.post(path, { nombre })).data,
    toggle: async (id: number, activo: boolean): Promise<GesiCatalogItem> =>
      (await api.patch(`${path}/${id}`, { activo })).data,
    delete: async (id: number): Promise<void> => { await api.delete(`${path}/${id}`) },
  }
}

export const departamentosApi = makeCatalogApi('/api/gesi/departamentos')
export const estadosApi       = makeCatalogApi('/api/gesi/estados')
export const origenesApi      = makeCatalogApi('/api/gesi/origenes')
export const tiposApi         = makeCatalogApi('/api/gesi/tipos')
export const municipiosApi    = makeCatalogApi('/api/gesi/municipios')

// Legacy named exports for backwards-compat
export const getDepartamentos  = departamentosApi.get
export const toggleDepartamento = (id: number, activo: boolean) => departamentosApi.toggle(id, activo)
export const getEstados        = estadosApi.get
export const toggleEstado      = (id: number, activo: boolean) => estadosApi.toggle(id, activo)
export const getOrigenes       = origenesApi.get
export const toggleOrigen      = (id: number, activo: boolean) => origenesApi.toggle(id, activo)
export const getTipos          = tiposApi.get
export const toggleTipo        = (id: number, activo: boolean) => tiposApi.toggle(id, activo)
export const getMunicipios     = municipiosApi.get
export const addMunicipio      = (nombre: string) => municipiosApi.add(nombre)
export const toggleMunicipio   = (id: number, activo: boolean) => municipiosApi.toggle(id, activo)
export const deleteMunicipio   = (id: number) => municipiosApi.delete(id)
