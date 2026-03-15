import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
      <div className="text-center">
        <p className="text-8xl font-black text-[var(--border)] mb-4 select-none">404</p>
        <p className="text-[var(--text-secondary)] mb-8">Página no encontrada</p>
        <Link
          to="/"
          className="text-sm text-[var(--accent)] hover:underline font-medium"
        >
          ← Volver al inicio
        </Link>
      </div>
    </div>
  )
}
