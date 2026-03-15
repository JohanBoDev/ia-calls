import { useParams } from 'react-router-dom'
import { useClienteChatQuery } from '@/features/clientes/hooks/useClientesQuery'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const RESULTADO_COLOR: Record<string, string> = {
  completado:            'bg-green-500/10 text-green-400 border-green-500/20',
  servicio_activo:       'bg-green-500/10 text-green-400 border-green-500/20',
  buzon_de_voz:          'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  no_contesto:           'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  sin_respuesta:         'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  cliente_colgo:         'bg-orange-500/10 text-orange-400 border-orange-500/20',
  cancelada_manualmente: 'bg-red-500/10 text-red-400 border-red-500/20',
  error_tecnico:         'bg-red-500/10 text-red-400 border-red-500/20',
}

function resultadoLabel(r: string): string {
  return r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function ClienteChatPage() {
  const { numero_ticket = '' } = useParams()
  const { data, isLoading } = useClienteChatQuery(numero_ticket)

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-8">
      <div className="max-w-3xl mx-auto">
        <PageHeader
          title={data?.numero_ticket ?? 'Ticket'}
          back={{ to: '/clientes', label: 'Tickets' }}
        >
          {data && (
            <span className="text-xs text-[var(--text-secondary)] font-mono">
              {data.telefono}
            </span>
          )}
        </PageHeader>

        {data && (
          <p className="text-sm text-[var(--text-secondary)] -mt-6 mb-6">
            {data.sector} — {data.municipio}
          </p>
        )}

        {isLoading && <LoadingSpinner />}

        <div className="space-y-4">
          {data?.llamadas.map((llamada, i) => (
            <div
              key={llamada.llamada_id}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
                <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Llamada #{(data?.llamadas.length ?? 0) - i}
                </span>
                <div className="flex items-center gap-3">
                  {llamada.resultado && (
                    <span className={cn(
                      'text-xs border px-2.5 py-1 rounded-full font-medium',
                      RESULTADO_COLOR[llamada.resultado] ?? 'bg-[var(--border)] text-[var(--text-secondary)] border-transparent'
                    )}>
                      {resultadoLabel(llamada.resultado)}
                    </span>
                  )}
                  <span className="text-xs text-[var(--text-muted)]">
                    {llamada.iniciada_en ? formatDate(llamada.iniciada_en) : '—'}
                  </span>
                </div>
              </div>

              {/* Mensajes */}
              <div className="p-5 space-y-3">
                {llamada.mensajes
                  .filter((m) => m.role !== 'system')
                  .map((msg, j) => (
                    <div key={j} className={cn('flex', msg.role === 'assistant' ? 'justify-start' : 'justify-end')}>
                      <div className={cn(
                        'max-w-[80%] px-4 py-2.5 rounded-xl text-sm leading-relaxed',
                        msg.role === 'assistant'
                          ? 'bg-[var(--border)] text-[var(--text-primary)]'
                          : 'bg-[var(--accent)] text-white',
                      )}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                {llamada.mensajes.filter((m) => m.role !== 'system').length === 0 && (
                  <p className="text-xs text-[var(--text-muted)] italic">Sin mensajes registrados</p>
                )}
              </div>

              {/* Respuestas estructuradas */}
              {llamada.respuestas.length > 0 && (
                <div className="border-t border-[var(--border)] px-5 py-3 bg-[var(--bg-primary)]">
                  <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Respuestas capturadas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {llamada.respuestas.map((r, k) => (
                      <span
                        key={k}
                        className="text-xs border border-[var(--border)] px-3 py-1 rounded-full flex items-center gap-1.5 text-[var(--text-secondary)]"
                      >
                        <span className="opacity-60">{r.pregunta.split('¿')[1]?.split('?')[0] ?? r.pregunta}:</span>
                        <span className="font-semibold text-[var(--text-primary)]">{r.respuesta}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {data?.llamadas.length === 0 && (
          <p className="text-center py-12 text-[var(--text-muted)]">
            Este ticket no tiene llamadas registradas
          </p>
        )}
      </div>
    </div>
  )
}
