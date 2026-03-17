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
        fontSize: 10,
        fontWeight: 600,
        color: c.text,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        fontFamily: "'Chakra Petch', sans-serif",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: c.dot,
          boxShadow: c.pulse ? `0 0 8px ${c.dot}, 0 0 3px ${c.dot}` : 'none',
          display: 'inline-block',
          flexShrink: 0,
        }}
        className={c.pulse ? 'animate-live' : ''}
      />
      {label ?? c.label}
    </span>
  )
}
