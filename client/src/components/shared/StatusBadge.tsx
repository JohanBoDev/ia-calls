import { cn } from '@/lib/utils'

interface Props {
  status: 'ok' | 'error' | 'degraded' | 'loading'
  label?: string
}

const config = {
  ok:       { dot: 'bg-green-400',  text: 'text-green-400',  label: 'Operativo' },
  degraded: { dot: 'bg-yellow-400', text: 'text-yellow-400', label: 'Degradado' },
  error:    { dot: 'bg-red-400',    text: 'text-red-400',    label: 'Error'      },
  loading:  { dot: 'bg-gray-500',   text: 'text-gray-400',   label: '...'        },
}

export function StatusBadge({ status, label }: Props) {
  const c = config[status]
  return (
    <span className={cn('flex items-center gap-1.5 text-xs font-semibold', c.text)}>
      <span className={cn('w-2 h-2 rounded-full', c.dot, status === 'ok' && 'animate-pulse')} />
      {label ?? c.label}
    </span>
  )
}
