import { RefreshCw, PhoneOff } from 'lucide-react'
import { useSesionesQuery, useCancelarSesionMutation } from '@/features/sesiones/hooks/useSesionesQuery'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

const PASOS: Record<number, string> = {
  2: 'Verificando servicio',
  3: 'Preguntando sector',
  4: 'Tipo de afectación',
}

export default function SesionesPage() {
  const { data: sesiones = [], isLoading, refetch } = useSesionesQuery()
  const { mutate: cancelar, isPending: cancelando } = useCancelarSesionMutation()

  const activas = sesiones.filter((s) => !s.terminada)

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-8">
      <div className="max-w-5xl mx-auto">
        <PageHeader title="Sesiones activas" back={{ to: '/', label: 'Dashboard' }}>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </PageHeader>

        {isLoading ? (
          <LoadingSpinner />
        ) : activas.length === 0 ? (
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-12 text-center">
            <p className="text-[var(--text-muted)]">No hay llamadas activas en este momento</p>
          </div>
        ) : (
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['Ticket', 'Teléfono', 'Municipio', 'Paso', 'Intento', 'Sector', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {activas.map((s) => (
                  <tr key={s.call_sid} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                    <td className="px-5 py-4 font-semibold text-[var(--text-primary)] font-mono text-xs">{s.numero_ticket}</td>
                    <td className="px-5 py-4 text-[var(--text-secondary)] font-mono text-xs">{s.telefono}</td>
                    <td className="px-5 py-4 text-[var(--text-secondary)]">{s.municipio}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs bg-[var(--accent)] bg-opacity-20 text-[var(--accent)] px-2 py-1 rounded-full font-medium">
                        {PASOS[s.paso_actual] ?? `Paso ${s.paso_actual}`}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-[var(--text-secondary)]">{s.intentos}</td>
                    <td className="px-5 py-4 text-[var(--text-secondary)]">{s.sector || '—'}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => cancelar(s.call_sid)}
                        disabled={cancelando}
                        className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 disabled:opacity-40 transition-colors ml-auto"
                      >
                        <PhoneOff className="w-3.5 h-3.5" />
                        Cancelar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
