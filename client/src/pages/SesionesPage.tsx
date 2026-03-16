import { useEffect, useState } from 'react'
import { PhoneOff, Clock, MapPin, Phone, Zap } from 'lucide-react'
import { useSesionesQuery, useCancelarSesionMutation } from '@/features/sesiones/hooks/useSesionesQuery'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

const PASOS: Record<number, { label: string; color: string }> = {
  2: { label: 'Verificando servicio', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  3: { label: 'Preguntando sector',   color: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  4: { label: 'Tipo de afectación',  color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
}

function useTiempoTranscurrido(creada_en: string) {
  const [segundos, setSegundos] = useState(0)

  useEffect(() => {
    const inicio = new Date(creada_en).getTime()
    const tick = () => setSegundos(Math.floor((Date.now() - inicio) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [creada_en])

  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function TarjetaSesion({ s, onCancelar, cancelando }: { s: any; onCancelar: () => void; cancelando: boolean }) {
  const tiempo = useTiempoTranscurrido(s.creada_en)
  const paso = PASOS[s.paso_actual] ?? { label: `Paso ${s.paso_actual}`, color: 'bg-gray-500/15 text-gray-400 border-gray-500/20' }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-[var(--text-primary)] font-mono">{s.numero_ticket}</p>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-[var(--text-secondary)]">
            <Phone className="w-3 h-3" />
            {s.telefono}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] bg-[var(--bg-primary)] border border-[var(--border)] px-2.5 py-1 rounded-full">
          <Clock className="w-3 h-3" />
          {tiempo}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
          <MapPin className="w-3 h-3" />
          {s.municipio}{s.sector ? ` — ${s.sector}` : ''}
        </div>
        {s.tipo_afectacion && (
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <Zap className="w-3 h-3" />
            {s.tipo_afectacion.replace('_', ' ')}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className={`text-xs border px-2.5 py-1 rounded-full font-medium ${paso.color}`}>
          {paso.label}
        </span>
        <button
          onClick={onCancelar}
          disabled={cancelando}
          className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 disabled:opacity-40 transition-colors"
        >
          <PhoneOff className="w-3.5 h-3.5" />
          Colgar
        </button>
      </div>
    </div>
  )
}

export default function SesionesPage() {
  const { data: sesiones = [], isLoading, refetch } = useSesionesQuery()
  const { mutate: cancelar, isPending: cancelando } = useCancelarSesionMutation()

  // Auto-refresh cada 5s
  useEffect(() => {
    const id = setInterval(() => refetch(), 5000)
    return () => clearInterval(id)
  }, [refetch])

  const activas = sesiones.filter((s) => !s.terminada)

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-8">
      <div className="max-w-5xl mx-auto">
        <PageHeader title="Sesiones activas" back={{ to: '/', label: 'Dashboard' }}>
          <span className="text-sm text-[var(--text-secondary)]">
            {activas.length} en curso · actualiza cada 5s
          </span>
        </PageHeader>

        {isLoading ? (
          <LoadingSpinner />
        ) : activas.length === 0 ? (
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-12 text-center">
            <p className="text-[var(--text-muted)]">No hay llamadas activas en este momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activas.map((s) => (
              <TarjetaSesion
                key={s.call_sid}
                s={s}
                onCancelar={() => cancelar(s.call_sid)}
                cancelando={cancelando}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
