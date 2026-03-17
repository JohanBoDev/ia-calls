import { useState } from 'react'
import { Download, Plus, Trash2 } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import {
  depHooks, estHooks, oriHooks, tipHooks, munHooks,
  useCargarGesiMutation,
} from '@/features/gesi/hooks/useGesiQuery'
import type { GesiCatalogItem, CargarTicketsResult } from '@/services/gesi.service'

// ── Toggle switch ──────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 36, height: 20, borderRadius: 10,
        background: checked ? 'var(--accent)' : 'var(--border)',
        border: 'none', cursor: 'pointer', position: 'relative',
        flexShrink: 0, transition: 'background 0.2s',
      }}
    >
      <span
        style={{
          position: 'absolute', top: 3, left: checked ? 19 : 3,
          width: 14, height: 14, borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
        }}
      />
    </button>
  )
}

// ── Editable catalog card ──────────────────────────────────────────────────────
function CatalogCard({
  title,
  hooks,
}: {
  title: string
  hooks: ReturnType<typeof depHooks.useList> extends infer R
    ? { useList: () => R; useAdd: () => ReturnType<typeof depHooks.useAdd>; useToggle: () => ReturnType<typeof depHooks.useToggle>; useDelete: () => ReturnType<typeof depHooks.useDelete> }
    : never
}) {
  const { data: items = [], isLoading } = hooks.useList() as { data: GesiCatalogItem[]; isLoading: boolean }
  const { mutate: addItem }    = hooks.useAdd()
  const { mutate: toggleItem } = hooks.useToggle()
  const { mutate: deleteItem } = hooks.useDelete()
  const [nuevo, setNuevo] = useState('')

  const handleAdd = () => {
    const nombre = nuevo.trim()
    if (!nombre) return
    addItem(nombre as never)
    setNuevo('')
  }

  const activos = items.filter((i) => i.activo).length

  return (
    <div className="card" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
        <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {activos}/{items.length} activos
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Agregar valor..."
          style={{
            flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'var(--text-primary)',
            fontFamily: "'Syne', sans-serif",
          }}
        />
        <button onClick={handleAdd} className="btn-accent" style={{ padding: '6px 12px', fontSize: 12 }}>
          <Plus size={13} />
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
          Sin entradas
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 10, padding: '5px 0', borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontSize: 12, flex: 1, color: item.activo ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {item.nombre}
              </span>
              <Toggle
                checked={item.activo}
                onChange={(v) => toggleItem({ id: item.id, activo: v } as never)}
              />
              <button
                onClick={() => deleteItem(item.id as never)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 2 }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--error)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function GesiPage() {
  const { mutate: cargar, isPending: cargando } = useCargarGesiMutation()
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [resultado, setResultado] = useState<CargarTicketsResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCargar = () => {
    setResultado(null)
    setError(null)
    cargar(
      { fecha_desde: fechaDesde || undefined, fecha_hasta: fechaHasta || undefined },
      {
        onSuccess: (data) => setResultado(data),
        onError: (e: unknown) => setError(e instanceof Error ? e.message : 'Error al conectar con GESI'),
      },
    )
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '7px 12px', fontSize: 12,
    color: 'var(--text-primary)', fontFamily: 'monospace',
  }

  return (
    <div>
      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: 24 }}>
        <p className="mono page-eyebrow" style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.28em', marginBottom: 8, textTransform: 'uppercase', opacity: 0.7 }}>
          CONFIGURACIÓN
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            GESI
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} style={inputStyle} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>→</span>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} style={inputStyle} />
            <button
              onClick={handleCargar}
              disabled={cargando}
              className="btn-accent"
              style={{ padding: '9px 18px', fontSize: 12, opacity: cargando ? 0.6 : 1 }}
            >
              <Download size={14} />
              {cargando ? 'Cargando...' : 'Cargar desde GESI'}
            </button>
          </div>
        </div>
      </div>

      {resultado && (
        <div className="animate-fade-in" style={{ marginBottom: 16, padding: '12px 18px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, fontSize: 13, color: 'var(--success)' }}>
          GESI: <strong>{resultado.total_gesi}</strong> tickets —{' '}
          <strong>{resultado.creados}</strong> nuevos, <strong>{resultado.actualizados}</strong> actualizados
        </div>
      )}
      {error && (
        <div className="animate-fade-in" style={{ marginBottom: 16, padding: '12px 18px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, fontSize: 13, color: 'var(--error)' }}>
          Error: {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <CatalogCard title="Departamentos" hooks={depHooks as never} />
        <CatalogCard title="Estados de ticket" hooks={estHooks as never} />
        <CatalogCard title="Orígenes" hooks={oriHooks as never} />
        <CatalogCard title="Tipos de ticket" hooks={tipHooks as never} />
        <div style={{ gridColumn: '1 / -1' }}>
          <CatalogCard title="Municipios" hooks={munHooks as never} />
        </div>
      </div>
    </div>
  )
}
