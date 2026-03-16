import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

interface Props {
  title: string
  back?: { to: string; label: string }
  children?: React.ReactNode
}

export function PageHeader({ title, back, children }: Props) {
  return (
    <div style={{ marginBottom: 28 }}>
      {back && (
        <Link
          to={back.to}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            marginBottom: 10,
            fontWeight: 500,
          }}
        >
          <ChevronLeft size={14} />
          {back.label}
        </Link>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h1>
        {children && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{children}</div>
        )}
      </div>
    </div>
  )
}
