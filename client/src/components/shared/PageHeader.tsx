import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

interface Props {
  title: string
  back?: { to: string; label: string }
  children?: React.ReactNode
}

export function PageHeader({ title, back, children }: Props) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        {back && (
          <Link
            to={back.to}
            className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  )
}
