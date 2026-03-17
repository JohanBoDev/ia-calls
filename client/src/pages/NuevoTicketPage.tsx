import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, Trash2, Upload, UserPlus, ChevronLeft } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useImportarTicketsMutation } from '@/features/clientes/hooks/useClientesQuery'
import type { TicketIn } from '@/services/clientes.service'

const EMPTY: TicketIn = { numero_ticket: '', telefono: '', sector: '', municipio: '' }

const COLS: { key: keyof TicketIn; label: string; placeholder: string; flex: number }[] = [
  { key: 'numero_ticket', label: 'N° Ticket',  placeholder: 'TK-001',      flex: 2 },
  { key: 'telefono',      label: 'Teléfono',   placeholder: '+573001234567', flex: 2 },
  { key: 'sector',        label: 'Dirección',  placeholder: 'MP EL PEON VD LA AGUADA', flex: 3 },
  { key: 'municipio',     label: 'Municipio',  placeholder: 'Bogotá',        flex: 2 },
]

export default function NuevoTicketPage() {
  const navigate = useNavigate()
  const { mutate: importar, isPending } = useImportarTicketsMutation()
  const [filas, setFilas] = useState<TicketIn[]>([{ ...EMPTY }])

  function actualizar(idx: number, campo: keyof TicketIn, valor: string) {
    if (campo === 'telefono') {
      const digits = valor.replace(/\D/g, '')
      valor = valor.startsWith('+') ? '+' + digits : '+57' + digits
    }
    setFilas((prev) => prev.map((f, i) => (i === idx ? { ...f, [campo]: valor } : f)))
  }

  function onExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target?.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })
      const parsed: TicketIn[] = rows
        .map((r) => {
          const tel = String(r['telefono'] ?? r['Telefono'] ?? r['phone'] ?? r['NUMERO TEL'] ?? r['Numero Tel'] ?? '').trim().replace(/\D/g, '')
          return {
            numero_ticket: String(r['numero_ticket'] ?? r['Ticket'] ?? r['ticket'] ?? r['numTicket'] ?? '').trim(),
            telefono:      tel ? (tel.startsWith('57') ? '+' + tel : '+57' + tel) : '',
            sector:        String(r['sector'] ?? r['Sector'] ?? r['lugar'] ?? r['network/line/description'] ?? r['localAdress'] ?? '').trim(),
            municipio:     String(r['municipio'] ?? r['Municipio'] ?? r['ciudad'] ?? r['cft'] ?? '').trim(),
          }
        })
        .filter((t) => t.numero_ticket && t.telefono)
      if (!parsed.length) {
        toast.error('No se encontraron filas válidas en el Excel')
        return
      }
      setFilas(parsed)
      toast.success(`${parsed.length} filas cargadas del Excel`)
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  function guardar() {
    const validos = filas.filter((f) => f.numero_ticket.trim() && f.telefono.trim())
    if (!validos.length) {
      toast.error('Completa al menos número de ticket y teléfono')
      return
    }
    importar(validos, {
      onSuccess: (res) => {
        toast.success(
          `${res.creados} tickets creados${res.duplicados ? `, ${res.duplicados} duplicados ignorados` : ''}`
        )
        navigate('/clientes')
      },
      onError: () => toast.error('Error al guardar los tickets'),
    })
  }

  const validos = filas.filter((f) => f.numero_ticket.trim() && f.telefono.trim()).length

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
              className="mono page-eyebrow"
              style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.28em', marginBottom: 8, textTransform: 'uppercase', opacity: 0.7 }}
            >
              IMPORTAR
            </p>
            <h1
              style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
            >
              Nuevo ticket
            </h1>
          </div>

          <label
            className="btn-ghost"
            style={{ padding: '9px 18px', fontSize: 12, cursor: 'pointer' }}
          >
            <Upload size={14} />
            Cargar Excel
            <input type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={onExcel} />
          </label>
        </div>

        <p
          className="mono"
          style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}
        >
          Columnas requeridas:{' '}
          {['numero_ticket', 'telefono', 'sector', 'municipio'].map((c, i) => (
            <span key={c}>
              <span style={{ color: 'var(--accent)' }}>{c}</span>
              {i < 3 && <span style={{ color: 'var(--text-muted)' }}>, </span>}
            </span>
          ))}
        </p>
      </div>

      {/* Table */}
      <div className="card animate-fade-in" style={{ overflow: 'hidden', marginBottom: 16 }}>
        {/* Header row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `${COLS.map((c) => `${c.flex}fr`).join(' ')} 36px`,
            gap: 0,
            padding: '10px 16px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {COLS.map((c) => (
            <span
              key={c.key}
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}
            >
              {c.label}
            </span>
          ))}
          <span />
        </div>

        {/* Rows */}
        <div>
          {filas.map((fila, idx) => (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: `${COLS.map((c) => `${c.flex}fr`).join(' ')} 36px`,
                gap: 0,
                alignItems: 'center',
                padding: '4px 16px',
                borderBottom: idx < filas.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}
            >
              {COLS.map((col) => (
                <input
                  key={col.key}
                  value={fila[col.key]}
                  onChange={(e) => actualizar(idx, col.key, e.target.value)}
                  placeholder={col.placeholder}
                  className="field-input"
                  style={{ margin: '3px 4px 3px 0' }}
                />
              ))}
              <button
                onClick={() => setFilas((prev) => prev.filter((_, i) => i !== idx))}
                disabled={filas.length === 1}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: 'transparent',
                  border: 'none',
                  cursor: filas.length === 1 ? 'not-allowed' : 'pointer',
                  color: 'var(--text-muted)',
                  opacity: filas.length === 1 ? 0.3 : 1,
                }}
                onMouseEnter={(e) => { if (filas.length > 1) e.currentTarget.style.color = 'var(--error)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="animate-fade-in-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => setFilas((prev) => [...prev, { ...EMPTY }])}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'Syne', sans-serif",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)' }}
        >
          <Plus size={15} />
          Agregar fila
        </button>

        <button
          onClick={guardar}
          disabled={isPending || validos === 0}
          className="btn-accent"
          style={{ padding: '11px 24px', fontSize: 13 }}
        >
          <UserPlus size={16} />
          {isPending ? 'Guardando...' : `Guardar ${validos > 0 ? validos : ''} ticket${validos !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}
