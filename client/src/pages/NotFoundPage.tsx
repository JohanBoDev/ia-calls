import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        gap: 0,
      }}
    >
      <p
        className="mono"
        style={{
          fontSize: 96,
          fontWeight: 700,
          color: 'var(--border)',
          lineHeight: 1,
          letterSpacing: '-0.04em',
          marginBottom: 16,
          userSelect: 'none',
        }}
      >
        404
      </p>
      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 24 }}>
        Página no encontrada
      </p>
      <Link
        to="/"
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--accent)',
          textDecoration: 'none',
        }}
      >
        ← Volver al inicio
      </Link>
    </div>
  )
}
