import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, Trash2, Upload, UserPlus } from 'lucide-react'
import * as XLSX from 'xlsx'
import { PageHeader } from '@/components/shared/PageHeader'
import { useImportarTicketsMutation } from '@/features/clientes/hooks/useClientesQuery'
import type { TicketIn } from '@/services/clientes.service'

const EMPTY: TicketIn = { numero_ticket: '', telefono: '', sector: '', municipio: '' }

export default function NuevoTicketPage() {
  const navigate = useNavigate()
  const { mutate: importar, isPending } = useImportarTicketsMutation()
  const [filas, setFilas] = useState<TicketIn[]>([{ ...EMPTY }])

  function actualizar(idx: number, campo: keyof TicketIn, valor: string) {
    if (campo === 'telefono') {
      const digits = valor.replace(/\D/g, '')
      if (!valor.startsWith('+')) {
        valor = '+57' + digits
      } else {
        valor = '+' + digits
      }
    }
    setFilas((prev) => prev.map((f, i) => (i === idx ? { ...f, [campo]: valor } : f)))
  }

  function agregarFila() {
    setFilas((prev) => [...prev, { ...EMPTY }])
  }

  function eliminarFila(idx: number) {
    setFilas((prev) => prev.filter((_, i) => i !== idx))
  }

  function onExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target?.result, { type: 'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })
      const parsed: TicketIn[] = rows.map((r) => {
        const tel = String(r['telefono'] ?? r['Telefono'] ?? r['phone'] ?? '').trim().replace(/\D/g, '')
        return {
          numero_ticket: String(r['numero_ticket'] ?? r['Ticket'] ?? r['ticket'] ?? '').trim(),
          telefono:      tel ? (tel.startsWith('57') ? '+' + tel : '+57' + tel) : '',
          sector:        String(r['sector']    ?? r['Sector']   ?? r['lugar']   ?? '').trim(),
          municipio:     String(r['municipio'] ?? r['Municipio'] ?? r['ciudad'] ?? '').trim(),
        }
      }).filter((t) => t.numero_ticket && t.telefono)
      if (!parsed.length) {
        toast.error('No se encontraron filas válidas en el Excel')
        return
      }
      setFilas(parsed)
      toast.success(`${parsed.length} filas cargadas del Excel`)
    }
    reader.readAsBinaryString(file)
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
        toast.success(`${res.creados} tickets creados${res.duplicados ? `, ${res.duplicados} duplicados ignorados` : ''}`)
        navigate('/clientes')
      },
      onError: () => toast.error('Error al guardar los tickets'),
    })
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-8">
      <div className="max-w-5xl mx-auto">
        <PageHeader title="Nuevo ticket" back={{ to: '/clientes', label: 'Tickets' }}>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--accent)] px-4 py-2 rounded-lg transition-colors">
            <Upload className="w-4 h-4" />
            Cargar Excel
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onExcel} />
          </label>
        </PageHeader>

        <p className="text-xs text-[var(--text-muted)] -mt-4 mb-6">
          El Excel debe tener columnas: <code className="text-[var(--accent)]">numero_ticket, telefono, sector, municipio</code>
        </p>

        {/* Tabla de filas */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden mb-4">
          <div className="grid grid-cols-[2fr_2fr_3fr_2fr_auto] gap-0 border-b border-[var(--border)] px-4 py-2">
            {['N° Ticket', 'Teléfono', 'Sector', 'Municipio', ''].map((h) => (
              <span key={h} className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{h}</span>
            ))}
          </div>

          <div className="divide-y divide-[var(--border)]">
            {filas.map((fila, idx) => (
              <div key={idx} className="grid grid-cols-[2fr_2fr_3fr_2fr_auto] gap-2 items-center px-4 py-2">
                {(['numero_ticket', 'telefono', 'sector', 'municipio'] as (keyof TicketIn)[]).map((campo) => (
                  <input
                    key={campo}
                    value={fila[campo]}
                    onChange={(e) => actualizar(idx, campo, e.target.value)}
                    placeholder={campo.replace('_', ' ')}
                    className="bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] border border-transparent focus:border-[var(--accent)] rounded-lg px-3 py-1.5 outline-none w-full"
                  />
                ))}
                <button
                  onClick={() => eliminarFila(idx)}
                  disabled={filas.length === 1}
                  className="p-1.5 text-[var(--text-muted)] hover:text-red-400 disabled:opacity-20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between">
          <button
            onClick={agregarFila}
            className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar fila
          </button>

          <button
            onClick={guardar}
            disabled={isPending}
            className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            {isPending ? 'Guardando...' : `Guardar ${filas.filter(f => f.numero_ticket && f.telefono).length || ''} tickets`}
          </button>
        </div>
      </div>
    </div>
  )
}
