import { useParams, Link } from 'react-router-dom'
import { useClienteChatQuery } from '@/features/clientes/hooks/useClientesQuery'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ChevronLeft, Phone, MapPin, MessageSquare } from 'lucide-react'

const RESULTADO_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  completado:            { color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)'  },
  servicio_activo:       { color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)'  },
  buzon_de_voz:          { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)'  },
  no_contesto:           { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)'  },
  sin_respuesta:         { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)'  },
  cliente_colgo:         { color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)'  },
  cancelada_manualmente: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)'   },
  error_tecnico:         { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)'   },
  timeout_sesion:        { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)'  },
}

function resultadoLabel(r: string): string {
  return r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function emptyMessage(resultado: string | undefined): string {
  if (resultado === 'buzon_de_voz') return 'Llamada atendida por buzón de voz'
  if (resultado === 'no_contesto' || resultado === 'timeout_sesion') return 'El cliente no contestó la llamada'
  if (resultado === 'error_tecnico') return 'Error técnico al realizar la llamada'
  return 'Sin mensajes registrados'
}

export default function ClienteChatPage() {
  const { numero_ticket = '' } = useParams()
  const { data, isLoading } = useClienteChatQuery(numero_ticket)

  return (
    <div>
      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: 28 }}>
        <Link
          to="/clientes"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            marginBottom: 12,
            fontWeight: 500,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)' }}
        >
          <ChevronLeft size={14} />
          Tickets
        </Link>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p
              className="mono"
              style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: 6 }}
            >
              HISTORIAL DE LLAMADAS
            </p>
            <h1
              className="mono"
              style={{ fontSize: 24, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.02em' }}
            >
              {data?.numero_ticket ?? numero_ticket}
            </h1>
          </div>

          {data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', paddingTop: 4 }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 12 }}
              >
                <Phone size={12} />
                <span className="mono">{data.telefono}</span>
              </div>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 12 }}
              >
                <MapPin size={12} />
                <span>{data.sector} — {data.municipio}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {isLoading && <LoadingSpinner />}

      {/* Calls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {data?.llamadas.map((llamada, i) => {
          const res = llamada.resultado
          const resStyle = res ? (RESULTADO_STYLE[res] ?? { color: 'var(--text-secondary)', bg: 'rgba(255,255,255,0.04)', border: 'var(--border)' }) : null
          const mensajesFiltrados = llamada.mensajes.filter((m) => m.role !== 'system')

          return (
            <div
              key={llamada.llamada_id}
              className={cn('card animate-fade-in')}
              style={{ overflow: 'hidden' }}
            >
              {/* Call header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: 'var(--bg-primary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: 'var(--accent-dim)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MessageSquare size={13} color="var(--accent)" />
                  </div>
                  <span
                    className="mono"
                    style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.12em' }}
                  >
                    LLAMADA #{(data?.llamadas.length ?? 0) - i}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {res && resStyle && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: resStyle.color,
                        background: resStyle.bg,
                        border: `1px solid ${resStyle.border}`,
                        borderRadius: 20,
                        padding: '3px 10px',
                      }}
                    >
                      {resultadoLabel(res)}
                    </span>
                  )}
                  <span
                    className="mono"
                    style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.04em' }}
                  >
                    {llamada.iniciada_en ? formatDate(llamada.iniciada_en) : '—'}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div style={{ padding: '18px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {mensajesFiltrados.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {emptyMessage(res ?? undefined)}
                  </p>
                ) : (
                  mensajesFiltrados.map((msg, j) => (
                    <div
                      key={j}
                      style={{
                        display: 'flex',
                        justifyContent: msg.role === 'assistant' ? 'flex-start' : 'flex-end',
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '78%',
                          padding: '10px 14px',
                          borderRadius: msg.role === 'assistant' ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                          fontSize: 13,
                          lineHeight: 1.5,
                          ...(msg.role === 'assistant'
                            ? {
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)',
                              }
                            : {
                                background: 'var(--accent)',
                                color: '#020c14',
                                fontWeight: 500,
                              }),
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Captured responses */}
              {llamada.respuestas.length > 0 && (
                <div
                  style={{
                    borderTop: '1px solid var(--border-subtle)',
                    padding: '12px 18px',
                    background: 'var(--bg-primary)',
                  }}
                >
                  <p
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      marginBottom: 10,
                    }}
                  >
                    Respuestas capturadas
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {llamada.respuestas.map((r, k) => (
                      <div
                        key={k}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 11,
                          border: '1px solid var(--border)',
                          borderRadius: 20,
                          padding: '4px 12px',
                          background: 'var(--bg-card)',
                        }}
                      >
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {r.pregunta.split('¿')[1]?.split('?')[0] ?? r.pregunta}:
                        </span>
                        <span className="mono" style={{ fontWeight: 600, color: 'var(--accent)', fontSize: 11 }}>
                          {r.respuesta}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {data?.llamadas.length === 0 && (
        <div className="card" style={{ padding: '60px 40px', textAlign: 'center' }}>
          <MessageSquare size={32} color="var(--text-muted)" style={{ margin: '0 auto 14px' }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Sin llamadas registradas
          </p>
        </div>
      )}
    </div>
  )
}
