import { Phone, Activity, Users, Server, Mic, Zap, Bot, PhoneCall, Terminal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useHealthQuery } from '@/features/llamadas/hooks/useHealthQuery'
import { useIniciarLlamadasMutation } from '@/features/llamadas/hooks/useLlamadasMutation'
import { useStatsQuery } from '@/features/stats/hooks/useStatsQuery'
import { useSesionesQuery } from '@/features/sesiones/hooks/useSesionesQuery'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PageHeader } from '@/components/shared/PageHeader'

const SERVICIO_ICON: Record<string, React.ReactNode> = {
  twilio:    <Phone className="w-4 h-4" />,
  azure_tts: <Mic className="w-4 h-4" />,
  deepgram:  <Zap className="w-4 h-4" />,
  deepseek:  <Bot className="w-4 h-4" />,
}

const TIPO_COLOR: Record<string, string> = {
  falla_total:  '#ef4444',
  luz_bajita:   '#f59e0b',
  microcortes:  '#4361ee',
}


export default function DashboardPage() {
  const { data: health, isLoading: loadingHealth } = useHealthQuery()
  const { data: stats, isLoading: loadingStats } = useStatsQuery()
  const { data: sesiones = [] } = useSesionesQuery()
  const { mutate: iniciar, isPending } = useIniciarLlamadasMutation()

  const globalStatus = loadingHealth ? 'loading' : health?.status === 'ok' ? 'ok' : 'degraded'
  const sesionesActivas = sesiones.filter((s) => !s.terminada).length

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-8">
      <div className="max-w-5xl mx-auto">

        <PageHeader title="ENEL AI Calls">
          <StatusBadge status={globalStatus} />
        </PageHeader>

        {/* Métricas principales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total tickets',   value: stats?.total_tickets   ?? '—', icon: <Users className="w-4 h-4" /> },
            { label: 'Total llamadas',  value: stats?.total_llamadas  ?? '—', icon: <Phone className="w-4 h-4" /> },
            { label: 'Completadas',     value: stats?.completadas     ?? '—', icon: <Activity className="w-4 h-4" /> },
            { label: '% Completada',    value: stats ? `${stats.pct_completada}%` : '—', icon: <Activity className="w-4 h-4" /> },
          ].map((m) => (
            <div key={m.label} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
              <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs mb-2">
                {m.icon} {m.label}
              </div>
              <p className="text-3xl font-bold text-[var(--text-primary)]">
                {loadingStats ? '—' : m.value}
              </p>
            </div>
          ))}
        </div>

        {/* Links de navegación */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Link to="/clientes" className="bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)] rounded-xl p-5 transition-colors group flex items-center gap-3">
            <Users className="w-5 h-5 text-[var(--accent)]" />
            <div>
              <p className="font-semibold text-[var(--text-primary)]">Clientes</p>
              <p className="text-xs text-[var(--text-secondary)]">Historial de llamadas</p>
            </div>
          </Link>
          <Link to="/sesiones" className="bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)] rounded-xl p-5 transition-colors group flex items-center gap-3">
            <PhoneCall className="w-5 h-5 text-green-400" />
            <div>
              <p className="font-semibold text-[var(--text-primary)]">Sesiones activas</p>
              <p className="text-xs text-[var(--text-secondary)]">{sesionesActivas} en curso</p>
            </div>
          </Link>
          <Link to="/logs" className="bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)] rounded-xl p-5 transition-colors group flex items-center gap-3">
            <Terminal className="w-5 h-5 text-[var(--text-secondary)]" />
            <div>
              <p className="font-semibold text-[var(--text-primary)]">Logs</p>
              <p className="text-xs text-[var(--text-secondary)]">Stream en tiempo real</p>
            </div>
          </Link>
        </div>

        {/* Gráficas */}
        {stats && stats.distribucion_tipo.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            {/* Tipo de afectación — barras */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
              <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-4">
                Tipo de afectación
              </h2>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={stats.distribucion_tipo} layout="vertical" barCategoryGap={10}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="tipo"
                    width={90}
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                    tickFormatter={(v) => String(v).replace(/_/g, ' ')}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                    labelFormatter={(v) => String(v).replace(/_/g, ' ')}
                    formatter={(v) => [v, 'Casos']}
                  />
                  <Bar dataKey="cantidad" radius={[0, 6, 6, 0]}>
                    {stats.distribucion_tipo.map((entry) => (
                      <Cell key={entry.tipo} fill={TIPO_COLOR[entry.tipo] ?? '#8b949e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Resumen */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
              <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-4">
                Resumen
              </h2>
              <div className="space-y-4">
                {[
                  { label: 'Completadas', value: stats.completadas, color: '#22c55e', total: stats.total_llamadas },
                  { label: 'No contestó', value: stats.no_contesto, color: '#f59e0b', total: stats.total_llamadas },
                ].map((item) => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                        <span className="text-[var(--text-secondary)]">{item.label}</span>
                      </div>
                      <span className="font-bold text-[var(--text-primary)]">{item.value}</span>
                    </div>
                    <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.total ? Math.round(item.value / item.total * 100) : 0}%`, background: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Servicios */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 mb-6">
          <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-4">Servicios externos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {health
              ? Object.entries(health.servicios).map(([nombre, srv]) => (
                  <div key={nombre} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm capitalize">
                      {SERVICIO_ICON[nombre] ?? <Server className="w-4 h-4" />}
                      {nombre.replace('_', ' ')}
                    </div>
                    <StatusBadge status={srv.status === 'ok' ? 'ok' : 'error'} />
                  </div>
                ))
              : ['twilio', 'azure_tts', 'deepgram', 'deepseek'].map((s) => (
                  <div key={s} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
                      {SERVICIO_ICON[s]} {s.replace('_', ' ')}
                    </div>
                    <StatusBadge status="loading" />
                  </div>
                ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => iniciar()}
          disabled={isPending || globalStatus === 'loading'}
          className="flex items-center gap-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-8 py-4 rounded-xl transition-colors"
        >
          <Phone className="w-5 h-5" />
          {isPending ? 'Iniciando llamadas...' : 'Iniciar llamadas'}
        </button>

      </div>
    </div>
  )
}
