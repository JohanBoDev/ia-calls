interface Props {
  status: 'ok' | 'error' | 'degraded' | 'loading'
  label?: string
}

const config = {
  ok:       { dot: 'var(--success)', text: 'var(--success)', label: 'Operativo',  pulse: true  },
  degraded: { dot: 'var(--warning)', text: 'var(--warning)', label: 'Degradado',  pulse: false },
  error:    { dot: 'var(--error)',   text: 'var(--error)',   label: 'Error',       pulse: false },
  loading:  { dot: 'var(--text-muted)', text: 'var(--text-muted)', label: '...',  pulse: false },
}

export function StatusBadge({ status, label }: Props) {
  const c = config[status]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        fontWeight: 600,
        color: c.text,
        letterSpacing: '0.04em',
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: c.dot,
          boxShadow: c.pulse ? `0 0 6px ${c.dot}` : 'none',
          display: 'inline-block',
          flexShrink: 0,
        }}
        className={c.pulse ? 'animate-live' : ''}
      />
      {label ?? c.label}
    </span>
  )
}
