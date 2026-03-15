import axios from 'axios'
import { env } from '@/config/env'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from 'sonner'

const api = axios.create({
  baseURL: env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message ?? 'Error inesperado'

    if (status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
      return Promise.reject(error)
    }
    if (status === 403) toast.error('No tienes permisos para esta acción')
    if (status === 404) toast.error('Recurso no encontrado')
    if (status >= 500) toast.error('Error del servidor, intenta más tarde')

    return Promise.reject(new Error(message))
  },
)

export default api
