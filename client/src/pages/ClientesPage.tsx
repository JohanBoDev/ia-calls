import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useClientesQuery, useEliminarTicketsMutation } from '@/features/clientes/hooks/useClientesQuery'
import { useLlamarSeleccionMutation } from '@/features/llamadas/hooks/useLlamadasMutation'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatDate } from '@/lib/utils'
import { MessageSquare, Phone, PhoneCall, Plus, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const ESTADO_BADGE: Record<string, string> = {
  pendiente:            'bg-gray-500/10 text-gray-400 border-gray-500/20',
  llamando:             'bg-blue-500/10 text-blue-400 border-blue-500/20',
  no_contesto:          'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  reintento_pendiente:  'bg-orange-500/10 text-orange-400 border-orange-500/20',
  completado:           'bg-green-500/10 text-green-400 border-green-500/20',
  fallido:              'bg-red-500/10 text-red-400 border-red-500/20',
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente:            'Pendiente',
  llamando:             'Llamando',
  no_contesto:          'No contestó',
  reintento_pendiente:  'Reintento',
  completado:           'Completado',
  fallido:              'Fallido',
}

function tiempoRestante(reintento_en: string | null): string {
  if (!reintento_en) return 'Reintento'
  const diff = new Date(reintento_en).getTime() - Date.now()
  if (diff <= 0) return 'Reintentando...'
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  if (h > 0) return `Reintentar en ${h}h ${m % 60}m`
  return `Reintentar en ${m}m`
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
    if (seleccion.size === tickets.length) {
      setSeleccion(new Set())
    } else {
      setSeleccion(new Set(tickets.map((t) => t.ticket_id)))
    }
  }

  const llamarUno = (id: number) => llamar([id])
  const llamarSeleccionados = () => llamar(Array.from(seleccion))

  const todosSeleccionados = tickets.length > 0 && seleccion.size === tickets.length
  const algunoSeleccionado = seleccion.size > 0

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-8">
      <div className="max-w-5xl mx-auto">
        <PageHeader title="Tickets" back={{ to: '/', label: 'Dashboard' }}>
          <span className="text-sm text-[var(--text-secondary)]">
            {tickets.length} registros
          </span>
          <Link
            to="/clientes/nuevo"
            className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo ticket
          </Link>
        </PageHeader>

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={todosSeleccionados}
                        onChange={toggleTodos}
                        className="w-4 h-4 accent-[var(--accent)] cursor-pointer"
                      />
                    </th>
                    {['Ticket', 'Teléfono', 'Sector', 'Municipio', 'Estado', 'Última llamada', ''].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {tickets.map((t) => (
                    <tr
                      key={t.ticket_id}
                      className={cn(
                        'hover:bg-[var(--bg-card-hover)] transition-colors',
                        seleccion.has(t.ticket_id) && 'bg-[var(--accent)]/5',
                      )}
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={seleccion.has(t.ticket_id)}
                          onChange={() => toggleOne(t.ticket_id)}
                          className="w-4 h-4 accent-[var(--accent)] cursor-pointer"
                        />
                      </td>
                      <td className="px-5 py-4 font-semibold text-[var(--text-primary)] font-mono text-xs">
                        {t.numero_ticket}
                      </td>
                      <td className="px-5 py-4 text-[var(--text-secondary)] font-mono text-xs">
                        {t.telefono}
                      </td>
                      <td className="px-5 py-4 text-[var(--text-secondary)]">{t.sector || '—'}</td>
                      <td className="px-5 py-4 text-[var(--text-secondary)]">{t.municipio}</td>
                      <td className="px-5 py-4">
                        <span className={cn('text-xs border px-2.5 py-1 rounded-full font-medium', ESTADO_BADGE[t.estado] ?? ESTADO_BADGE.pendiente)}>
                          {t.estado === 'reintento_pendiente' ? tiempoRestante(t.reintento_en) : (ESTADO_LABEL[t.estado] ?? t.estado)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[var(--text-secondary)] text-xs">
                        {t.ultima_llamada ? formatDate(t.ultima_llamada) : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => llamarUno(t.ticket_id)}
                            disabled={llamando}
                            title="Llamar ahora"
                            className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 disabled:opacity-40 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Llamar
                          </button>
                          <Link
                            to={`/clientes/${t.numero_ticket}`}
                            className="flex items-center gap-1 text-xs text-[var(--accent)] hover:underline font-medium"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Chat
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tickets.length === 0 && (
                <p className="text-center py-12 text-[var(--text-muted)]">Sin tickets registrados aún</p>
              )}
            </div>

            {/* Barra de acción flotante */}
            {algunoSeleccionado && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl px-6 py-3">
                <span className="text-sm text-[var(--text-secondary)]">
                  <span className="font-bold text-[var(--text-primary)]">{seleccion.size}</span> seleccionado{seleccion.size !== 1 ? 's' : ''}
                </span>
                <div className="w-px h-5 bg-[var(--border)]" />
                <button
                  onClick={llamarSeleccionados}
                  disabled={llamando || eliminando}
                  className="flex items-center gap-2 text-sm font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 text-white px-4 py-2 rounded-xl transition-colors"
                >
                  <PhoneCall className="w-4 h-4" />
                  {llamando ? 'Llamando...' : `Llamar ${seleccion.size}`}
                </button>
                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar ${seleccion.size} ticket${seleccion.size !== 1 ? 's' : ''}?`)) {
                      eliminar(Array.from(seleccion), { onSuccess: () => setSeleccion(new Set()) })
                    }
                  }}
                  disabled={llamando || eliminando}
                  className="flex items-center gap-2 text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {eliminando ? 'Eliminando...' : 'Eliminar'}
                </button>
                <button
                  onClick={() => setSeleccion(new Set())}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
