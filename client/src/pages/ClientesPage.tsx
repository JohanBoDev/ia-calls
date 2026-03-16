import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useClientesQuery, useEliminarTicketsMutation } from '@/features/clientes/hooks/useClientesQuery'
import { useLlamarSeleccionMutation } from '@/features/llamadas/hooks/useLlamadasMutation'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatDate } from '@/lib/utils'
import { MessageSquare, Phone, PhoneCall, Plus, Trash2, X, Users } from 'lucide-react'

const ESTADO_STYLE: Record<string, { color: string; bg: string; border: string; label: string }> = {
  pendiente:           { color: 'var(--text-secondary)', bg: 'rgba(255,255,255,0.04)', border: 'var(--border)',              label: 'Pendiente'  },
  llamando:            { color: '#22d3ee',               bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.2)',       label: 'Llamando'   },
  no_contesto:         { color: '#f59e0b',               bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)',       label: 'No contestó'},
  reintento_pendiente: { color: '#f97316',               bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)',       label: 'Reintento'  },
  completado:          { color: '#10b981',               bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)',       label: 'Completado' },
  fallido:             { color: '#ef4444',               bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',        label: 'Fallido'    },
}

function tiempoRestante(reintento_en: string | null): string {
  if (!reintento_en) return 'Reintento'
  const diff = new Date(reintento_en).getTime() - Date.now()
  if (diff <= 0) return 'Reintentando'
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  if (h > 0) return `↻ ${h}h ${m % 60}m`
  return `↻ ${m}m`
}

function EstadoBadge({ estado, reintento_en }: { estado: string; reintento_en?: string | null }) {
  const s = ESTADO_STYLE[estado] ?? ESTADO_STYLE.pendiente
  const label = estado === 'reintento_pendiente' ? tiempoRestante(reintento_en ?? null) : s.label
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 20,
        padding: '3px 9px',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

export default function ClientesPage() {
  const { data: tickets = [], isLoading } = useClientesQuery()
  const [seleccion, setSeleccion] = useState<Set<number>>(new Set())
  const { mutate: llamar, isPending: llamando } = useLlamarSeleccionMutation(() => setSeleccion(new Set()))
  const { mutate: eliminar, isPending: eliminando } = useEliminarTicketsMutation()

  const toggleOne = (id: number) => {
    setSeleccion((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleTodos = () => {
    setSeleccion(seleccion.size === tickets.length ? new Set() : new Set(tickets.map((t) => t.ticket_id)))
  }

  const todosSeleccionados = tickets.length > 0 && seleccion.size === tickets.length
  const algunoSeleccionado = seleccion.size > 0

  return (
    <div>
      {/* Header */}
      <div
        className="animate-fade-in"
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}
      >
        <div>
          <p
            className="mono"
            style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: 6 }}
          >
            GESTIÓN
          </p>
          <h1
            style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
          >
            Tickets
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
          <span
            className="mono"
            style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em' }}
          >
            {tickets.length} registros
          </span>
          <Link
            to="/clientes/nuevo"
            className="btn-accent"
            style={{ padding: '9px 18px', fontSize: 12, textDecoration: 'none' }}
          >
            <Plus size={14} strokeWidth={2.5} />
            Nuevo ticket
          </Link>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="card animate-fade-in" style={{ overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 44, paddingLeft: 18 }}>
                    <input
                      type="checkbox"
                      checked={todosSeleccionados}
                      onChange={toggleTodos}
                      style={{ width: 14, height: 14, accentColor: 'var(--accent)', cursor: 'pointer' }}
                    />
                  </th>
                  {['Ticket', 'Teléfono', 'Sector', 'Municipio', 'Estado', 'Última llamada', ''].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr
                    key={t.ticket_id}
                    className={seleccion.has(t.ticket_id) ? 'selected' : ''}
                    style={{ cursor: 'default' }}
                  >
                    <td style={{ paddingLeft: 18, paddingRight: 8 }}>
                      <input
                        type="checkbox"
                        checked={seleccion.has(t.ticket_id)}
                        onChange={() => toggleOne(t.ticket_id)}
                        style={{ width: 14, height: 14, accentColor: 'var(--accent)', cursor: 'pointer' }}
                      />
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
                        {t.numero_ticket}
                      </span>
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {t.telefono}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{t.sector || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{t.municipio}</td>
                    <td>
                      <EstadoBadge estado={t.estado} reintento_en={t.reintento_en} />
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {t.ultima_llamada ? formatDate(t.ultima_llamada) : '—'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => llamar([t.ticket_id])}
                          disabled={llamando}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--success)',
                            background: 'transparent',
                            border: 'none',
                            cursor: llamando ? 'not-allowed' : 'pointer',
                            opacity: llamando ? 0.4 : 1,
                            fontFamily: "'Syne', sans-serif",
                          }}
                        >
                          <Phone size={12} />
                          Llamar
                        </button>
                        <Link
                          to={`/clientes/${t.numero_ticket}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--accent)',
                            textDecoration: 'none',
                          }}
                        >
                          <MessageSquare size={12} />
                          Chat
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tickets.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 40px' }}>
                <Users size={32} color="var(--text-muted)" style={{ margin: '0 auto 14px' }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Sin tickets registrados
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Crea el primer ticket con el botón "Nuevo ticket"
                </p>
              </div>
            )}
          </div>

          {/* Floating action bar */}
          {algunoSeleccionado && (
            <div
              style={{
                position: 'fixed',
                bottom: 28,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: '10px 18px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(12px)',
                zIndex: 50,
              }}
            >
              <span
                className="mono"
                style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}
              >
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{seleccion.size}</span>{' '}
                seleccionado{seleccion.size !== 1 ? 's' : ''}
              </span>

              <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

              <button
                onClick={() => llamar(Array.from(seleccion))}
                disabled={llamando || eliminando}
                className="btn-accent"
                style={{ padding: '7px 16px', fontSize: 12 }}
              >
                <PhoneCall size={14} />
                {llamando ? 'Llamando...' : `Llamar ${seleccion.size}`}
              </button>

              <button
                onClick={() => {
                  if (confirm(`¿Eliminar ${seleccion.size} ticket${seleccion.size !== 1 ? 's' : ''}?`)) {
                    eliminar(Array.from(seleccion), { onSuccess: () => setSeleccion(new Set()) })
                  }
                }}
                disabled={llamando || eliminando}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 16px',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--error)',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 9,
                  cursor: llamando || eliminando ? 'not-allowed' : 'pointer',
                  opacity: llamando || eliminando ? 0.4 : 1,
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                <Trash2 size={14} />
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>

              <button
                onClick={() => setSeleccion(new Set())}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)' }}
              >
                <X size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
