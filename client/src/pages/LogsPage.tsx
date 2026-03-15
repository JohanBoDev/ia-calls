import { useLogsStream } from '@/hooks/useLogsStream'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const levelColor: Record<string, string> = {
  INFO:    'text-[var(--text-secondary)]',
  WARNING: 'text-yellow-400',
  ERROR:   'text-red-400',
  DEBUG:   'text-[var(--text-muted)]',
}

const levelBg: Record<string, string> = {
  INFO:    '',
  WARNING: 'bg-yellow-400/5',
  ERROR:   'bg-red-400/5',
  DEBUG:   '',
}

export default function LogsPage() {
  const { logs, connected, clear } = useLogsStream()

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-8">
      <div className="max-w-5xl mx-auto">
        <PageHeader title="Logs en tiempo real" back={{ to: '/', label: 'Dashboard' }}>
          <StatusBadge status={connected ? 'ok' : 'error'} label={connected ? 'Conectado' : 'Desconectado'} />
          <button
            onClick={clear}
            className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Limpiar
          </button>
        </PageHeader>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden font-mono text-xs">
          {logs.length === 0 ? (
            <p className="text-center py-12 text-[var(--text-muted)]">
              {connected ? 'Esperando logs...' : 'Conectando...'}
            </p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {logs.map((log, i) => (
                <div key={i} className={cn('flex gap-4 px-5 py-2 items-start', levelBg[log.level])}>
                  <span className="text-[var(--text-muted)] shrink-0 w-16">{log.ts}</span>
                  <span className={cn('shrink-0 w-16 font-bold', levelColor[log.level])}>
                    {log.level}
                  </span>
                  <span className="text-[var(--accent)] shrink-0 w-28 truncate">{log.modulo}</span>
                  <span className="text-[var(--text-primary)] break-all">{log.mensaje}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
