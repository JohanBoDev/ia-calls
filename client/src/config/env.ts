import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.string().url('VITE_API_URL debe ser una URL válida'),
  VITE_APP_NAME: z.string().default('Morpheo'),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  console.error('❌ Error en variables de entorno:', parsed.error.format())
  throw new Error('Variables de entorno inválidas')
}

export const env = parsed.data
