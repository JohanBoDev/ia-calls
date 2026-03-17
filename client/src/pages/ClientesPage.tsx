import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useClientesQuery, useEliminarTicketsMutation } from '@/features/clientes/hooks/useClientesQuery'
import { useLlamarSeleccionMutation } from '@/features/llamadas/hooks/useLlamadasMutation'
import { useCargarGesiMutation } from '@/features/gesi/hooks/useGesiQuery'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatDate } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Download, MessageSquare, Phone, PhoneCall, Plus, Trash2, X, Users } from 'lucide-react'

const ESTADO_STYLE: Record<string, { color: string; bg: string; border: string; label: string }> = {
  pendiente:           { color: 'var(--text-secondary)', bg: 'rgba(255,255,255,0.04)', border: 'var(--border)',              label: 'Pendiente'  },
  llamando:            { color: '#22d3ee',               bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.2)',       label: 'Llamando'   },
  no_contesto:         { color: '#f59e0b',               bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)',       label: 'No contestó'},
  reintento_pendiente: { color: '#f97316',               bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)',       label: 'Reintento'  },
  completado:          { color: '#10b981',               bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)',       label: 'Completado' },
  fallido:             { color: '#ef4444',               bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',        label: 'Fallido'    },
}

const GESI_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  AS: { color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)' },
  AC: { color: '#22d3ee', bg: 'rgba(34,211,238,0.08)',  border: 'rgba(34,211,238,0.2)'  },
}

const PAGE_SIZES = [25, 50, 100]

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
        fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
        color: s.color, background: s.bg, border: `1px solid ${s.border}`,
        borderRadius: 20, padding: '3px 9px', whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

function GesiBadge({ codigo }: { codigo: string }) {
  const s = GESI_STYLE[codigo] ?? { color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.04)', border: 'var(--border)' }
  return (
    <span
      className="mono"
      style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
        color: s.color, background: s.bg, border: `1px solid ${s.border}`,
        borderRadius: 20, padding: '3px 8px',
      }}
    >
      {codigo}
    </span>
  )
}

function primerNombre(nombre: string | null | undefined): string {
  if (!nombre) return '—'
  return nombre.trim().split(/\s+/).slice(0, 2).join(' ')
}

export default function ClientesPage() {
  const { data: tickets = [], isLoading } = useClientesQuery()
  const [seleccion, setSeleccion]   = useState<Set<number>>(new Set())
  const [busqueda, setBusqueda]     = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroMun, setFiltroMun]   = useState('')
  const [pageSize, setPageSize]     = useState(25)
  const [page, setPage]             = useState(1)

  const { mutate: llamar, isPending: llamando }   = useLlamarSeleccionMutation(() => setSeleccion(new Set()))
  const { mutate: eliminar, isPending: eliminando } = useEliminarTicketsMutation()
  const { mutate: cargarGesi, isPending: cargandoGesi } = useCargarGesiMutation()

  // Unique municipios for filter dropdown
  const municipios = useMemo(
    () => [...new Set(tickets.map((t) => t.municipio).filter(Boolean))].sort(),
    [tickets],
  )

  // Filtered list
  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase()
    return tickets.filter((t) => {
      if (filtroEstado && t.estado !== filtroEstado) return false
      if (filtroMun && t.municipio !== filtroMun) return false
      if (q) {
        const haystack = [t.numero_ticket, t.telefono, t.sector, t.municipio, t.nombre ?? '']
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [tickets, busqueda, filtroEstado, filtroMun])

  const totalPages = Math.max(1, Math.ceil(filtrados.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtrados.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const resetPage = () => setPage(1)

  const toggleOne = (id: number) => {
    setSeleccion((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const todosSeleccionados = paginated.length > 0 && paginated.every((t) => seleccion.has(t.ticket_id))
  const toggleTodos = () => {
    if (todosSeleccionados) {
      setSeleccion((prev) => {
        const next = new Set(prev)
        paginated.forEach((t) => next.delete(t.ticket_id))
        return next
      })
    } else {
      setSeleccion((prev) => {
        const next = new Set(prev)
        paginated.forEach((t) => next.add(t.ticket_id))
        return next
      })
    }
  }

  const algunoSeleccionado = seleccion.size > 0

  const selectStyle: React.CSSProperties = {
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '7px 10px',
    fontSize: 12,
    color: 'var(--text-primary)',
    fontFamily: "'Syne', sans-serif",
    cursor: 'pointer',
  }

  return (
    <div>
      {/* Header */}
      <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <p className="mono" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: 6 }}>
            GESTIÓN
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Tickets
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            {filtrados.length} registros
          </span>
          <button
            onClick={() => cargarGesi({})}
            disabled={cargandoGesi}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', fontSize: 12, fontWeight: 700,
              color: '#22d3ee', background: 'rgba(34,211,238,0.08)',
              border: '1px solid rgba(34,211,238,0.2)', borderRadius: 9,
              cursor: cargandoGesi ? 'not-allowed' : 'pointer',
              opacity: cargandoGesi ? 0.6 : 1,
              fontFamily: "'Syne', sans-serif",
            }}
          >
            <Download size={14} />
            {cargandoGesi ? 'Cargando...' : 'Cargar GESI'}
          </button>
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

      {/* Filter bar */}
      <div className="animate-fade-in" style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); resetPage() }}
          placeholder="Buscar ticket, teléfono, sector..."
          style={{ ...selectStyle, flex: 1, minWidth: 200 }}
        />
        <select value={filtroEstado} onChange={(e) => { setFiltroEstado(e.target.value); resetPage() }} style={selectStyle}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_STYLE).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select value={filtroMun} onChange={(e) => { setFiltroMun(e.target.value); resetPage() }} style={selectStyle}>
          <option value="">Todos los municipios</option>
          {municipios.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); resetPage() }}
          style={{ ...selectStyle, width: 80 }}
        >
          {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="card animate-fade-in" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ minWidth: 900 }}>
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
                    {['Ticket', 'Nombre', 'Teléfono', 'Sector', 'Municipio', 'GESI', 'Estado', 'Última llamada', ''].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((t) => (
                    <tr key={t.ticket_id} className={seleccion.has(t.ticket_id) ? 'selected' : ''} style={{ cursor: 'default' }}>
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
                      <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                        {primerNombre(t.nombre)}
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {t.telefono}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{t.sector || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{t.municipio}</td>
                      <td>
                        {t.estado_gesi ? <GesiBadge codigo={t.estado_gesi} /> : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>}
                      </td>
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
                              display: 'flex', alignItems: 'center', gap: 4,
                              fontSize: 11, fontWeight: 600, color: 'var(--success)',
                              background: 'transparent', border: 'none',
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
                              display: 'flex', alignItems: 'center', gap: 4,
                              fontSize: 11, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none',
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
            </div>

            {paginated.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 40px' }}>
                <Users size={32} color="var(--text-muted)" style={{ margin: '0 auto 14px' }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  {tickets.length === 0 ? 'Sin tickets registrados' : 'Sin resultados'}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {tickets.length === 0
                    ? 'Crea el primer ticket con el botón "Nuevo ticket"'
                    : 'Prueba con otros filtros'}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  display: 'flex', alignItems: 'center', padding: '6px 10px',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 8, cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.4 : 1, color: 'var(--text-secondary)',
                }}
              >
                <ChevronLeft size={15} />
              </button>
              <span className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  display: 'flex', alignItems: 'center', padding: '6px 10px',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 8, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.4 : 1, color: 'var(--text-secondary)',
                }}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}

          {/* Floating action bar — portaled to body to avoid fixed/transform issues */}
          {algunoSeleccionado && createPortal(
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
                zIndex: 9999,
              }}
            >
              <span className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
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
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 16px', fontSize: 12, fontWeight: 700,
                  color: 'var(--error)', background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)', borderRadius: 9,
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
                  display: 'flex', alignItems: 'center',
                  background: 'transparent', border: 'none',
                  cursor: 'pointer', color: 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)' }}
              >
                <X size={16} />
              </button>
            </div>,
            document.body,
          )}
        </>
      )}
    </div>
  )
}
