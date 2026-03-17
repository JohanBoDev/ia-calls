import { useLogsStream } from '@/hooks/useLogsStream'
import { Trash2, Terminal, Wifi, WifiOff } from 'lucide-react'

const LEVEL_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  INFO:    { color: 'var(--text-secondary)', bg: 'transparent',             label: 'INFO'  },
  WARNING: { color: '#f59e0b',              bg: 'rgba(245,158,11,0.04)',   label: 'WARN'  },
  ERROR:   { color: '#ef4444',              bg: 'rgba(239,68,68,0.05)',    label: 'ERR'   },
  DEBUG:   { color: 'var(--text-muted)',    bg: 'transparent',             label: 'DBG'   },
}

export default function LogsPage() {
  const { logs, connected, clear } = useLogsStream()

  return (
    <div>
      {/* Header */}
      <div
        className="animate-fade-in"
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}
      >
        <div>
          <p
            className="mono page-eyebrow"
            style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.28em', marginBottom: 8, textTransform: 'uppercase', opacity: 0.7 }}
          >
            SISTEMA
          </p>
          <h1
            style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
          >
            Logs en tiempo real
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
          {/* Connection badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              background: connected ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              border: connected ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)',
              borderRadius: 20,
              padding: '5px 12px',
            }}
          >
            {connected
              ? <Wifi size={12} color="var(--success)" />
              : <WifiOff size={12} color="var(--error)" />
            }
            <span
              className="mono"
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: connected ? 'var(--success)' : 'var(--error)',
              }}
            >
              {connected ? 'CONECTADO' : 'DESCONECTADO'}
            </span>
          </div>

          <button
            onClick={clear}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 9,
              padding: '7px 14px',
              cursor: 'pointer',
              fontFamily: "'Syne', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--error)'
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          >
            <Trash2 size={13} />
            Limpiar
          </button>
        </div>
      </div>

      {/* Log terminal */}
      <div
        className="card animate-fade-in log-terminal"
        style={{ overflow: 'hidden' }}
      >
        {/* Terminal title bar */}
        <div
          className="log-terminal-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 16px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-primary)',
          }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            {['#ef4444', '#f59e0b', '#10b981'].map((c) => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.6 }} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' }}>
            <Terminal size={11} color="var(--text-muted)" />
            <span
              className="mono"
              className="log-bar-label"
              style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.12em' }}
            >
              system.log — {logs.length} líneas
            </span>
          </div>
        </div>

        {/* Log entries */}
        <div
          className="log-terminal-body"
          style={{
            minHeight: 400,
            maxHeight: 'calc(100vh - 280px)',
            overflowY: 'auto',
            background: 'var(--bg-primary)',
          }}
        >
          {logs.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 300,
                gap: 10,
              }}
            >
              <Terminal size={28} color="var(--text-muted)" />
              <p
                className="mono"
                style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.08em' }}
              >
                {connected ? '> esperando eventos...' : '> conectando...'}
              </p>
            </div>
          ) : (
            logs.map((log, i) => {
              const ls = LEVEL_STYLE[log.level] ?? LEVEL_STYLE.INFO
              return (
                <div
                  key={i}
                  className="log-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '70px 42px 120px 1fr',
                    gap: 0,
                    padding: '4px 16px',
                    background: ls.bg,
                    borderBottom: '1px solid var(--border-subtle)',
                    alignItems: 'baseline',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-card-hover)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = ls.bg
                  }}
                >
                  {/* Timestamp */}
                  <span
                    className="mono log-ts"
                    style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.04em', paddingRight: 8 }}
                  >
                    {log.ts}
                  </span>

                  {/* Level */}
                  <span
                    className="mono"
                    style={{ fontSize: 10, fontWeight: 700, color: ls.color, letterSpacing: '0.06em', paddingRight: 8 }}
                  >
                    {ls.label}
                  </span>

                  {/* Module */}
                  <span
                    className="mono"
                    className="log-module"
                    style={{
                      fontSize: 10,
                      color: 'var(--accent)',
                      opacity: 0.7,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      paddingRight: 12,
                    }}
                  >
                    {log.modulo}
                  </span>

                  {/* Message */}
                  <span
                    className="mono log-msg"
                    style={{ fontSize: 11, color: 'var(--text-primary)', wordBreak: 'break-all', lineHeight: 1.6 }}
                  >
                    {log.mensaje}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
