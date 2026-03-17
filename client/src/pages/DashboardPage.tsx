import { Phone, Activity, Users, Server, Mic, Zap, Bot, PhoneCall, Terminal, TrendingUp, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useHealthQuery } from '@/features/llamadas/hooks/useHealthQuery'
import { useIniciarLlamadasMutation } from '@/features/llamadas/hooks/useLlamadasMutation'
import { useStatsQuery } from '@/features/stats/hooks/useStatsQuery'
import { useSesionesQuery } from '@/features/sesiones/hooks/useSesionesQuery'
import { StatusBadge } from '@/components/shared/StatusBadge'

const SERVICIO_ICON: Record<string, React.ReactNode> = {
  twilio:    <Phone size={13} />,
  azure_tts: <Mic size={13} />,
  deepgram:  <Zap size={13} />,
  deepseek:  <Bot size={13} />,
}

const TIPO_COLOR: Record<string, string> = {
  falla_total:  '#ff5252',
  luz_bajita:   '#ffab40',
  microcortes:  '#00e676',
}

const METRICS = (stats: any, loadingStats: boolean) => [
  {
    label: 'Total tickets',
    value: loadingStats ? '—' : (stats?.total_tickets ?? '—'),
    icon: <Users size={14} />,
    color: '#22d3ee',
    delay: 'animate-fade-in',
  },
  {
    label: 'Total llamadas',
    value: loadingStats ? '—' : (stats?.total_llamadas ?? '—'),
    icon: <Phone size={14} />,
    color: '#ffab40',
    delay: 'animate-fade-in-2',
  },
  {
    label: 'Completadas',
    value: loadingStats ? '—' : (stats?.completadas ?? '—'),
    icon: <Activity size={14} />,
    color: '#40c4ff',
    delay: 'animate-fade-in-3',
  },
  {
    label: '% Completada',
    value: loadingStats ? '—' : (stats ? `${stats.pct_completada}%` : '—'),
    icon: <TrendingUp size={14} />,
    color: '#ea80fc',
    delay: 'animate-fade-in-4',
  },
]

export default function DashboardPage() {
  const { data: health, isLoading: loadingHealth } = useHealthQuery()
  const { data: stats, isLoading: loadingStats } = useStatsQuery()
  const { data: sesiones = [] } = useSesionesQuery()
  const { mutate: iniciar, isPending } = useIniciarLlamadasMutation()

  const globalStatus = loadingHealth ? 'loading' : health?.status === 'ok' ? 'ok' : 'degraded'
  const sesionesActivas = sesiones.filter((s) => !s.terminada).length
  const metrics = METRICS(stats, loadingStats)

  return (
    <div>
      {/* ── Header ── */}
      <div
        className="animate-fade-in"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 36,
        }}
      >
        <div>
          <p
            className="mono page-eyebrow"
            style={{
              fontSize: 10,
              color: 'var(--accent)',
              letterSpacing: '0.28em',
              marginBottom: 8,
              textTransform: 'uppercase',
              opacity: 0.7,
            }}
          >
            Panel de control
          </p>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              lineHeight: 1,
              textTransform: 'uppercase',
            }}
          >
            Morpheo
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
            <StatusBadge status={globalStatus} />
            {sesionesActivas > 0 && (
              <span
                className="mono animate-live"
                style={{
                  fontSize: 9,
                  color: 'var(--success)',
                  background: 'rgba(0,230,118,0.08)',
                  border: '1px solid rgba(0,230,118,0.2)',
                  borderRadius: 4,
                  padding: '3px 8px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                ● {sesionesActivas} en vivo
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => iniciar()}
          disabled={isPending || globalStatus === 'loading'}
          className="btn-accent"
          style={{ padding: '13px 24px', fontSize: 12 }}
        >
          <Phone size={15} strokeWidth={2.5} />
          {isPending ? 'Iniciando...' : 'Iniciar llamadas'}
        </button>
      </div>

      {/* ── Metrics ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {metrics.map((m) => (
          <div
            key={m.label}
            className={`metric-card ${m.delay}`}
            style={{ padding: '20px 20px 18px', '--metric-color': m.color } as React.CSSProperties}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}
            >
              <span
                className="section-label"
                style={{ fontSize: 9, letterSpacing: '0.16em' }}
              >
                {m.label}
              </span>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${m.color}14`,
                  color: m.color,
                  border: `1px solid ${m.color}22`,
                }}
              >
                {m.icon}
              </div>
            </div>
            <p
              className="mono animate-number"
              style={{
                fontSize: 36,
                fontWeight: 500,
                color: loadingStats ? 'var(--text-muted)' : 'var(--text-primary)',
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Nav cards ── */}
      <div
        className="animate-fade-in-2"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}
      >
        {[
          {
            to: '/clientes',
            icon: <Users size={16} />,
            label: 'Tickets',
            sub: 'Historial de llamadas',
            color: '#22d3ee',
          },
          {
            to: '/sesiones',
            icon: <PhoneCall size={16} />,
            label: 'Sesiones activas',
            sub: `${sesionesActivas} en curso`,
            color: '#40c4ff',
          },
          {
            to: '/logs',
            icon: <Terminal size={16} />,
            label: 'Logs',
            sub: 'Stream en tiempo real',
            color: '#ffab40',
          },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            style={{ textDecoration: 'none' }}
            className="card card-hover"
          >
            <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    background: `${item.color}10`,
                    border: `1px solid ${item.color}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: item.color,
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3, letterSpacing: '0.01em' }}>
                    {item.label}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400 }}>{item.sub}</p>
                </div>
              </div>
              <ArrowUpRight size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </div>
          </Link>
        ))}
      </div>

      {/* ── Charts ── */}
      {stats && stats.distribucion_tipo.length > 0 && (
        <div
          className="animate-fade-in-3"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}
        >
          {/* Bar chart */}
          <div className="card" style={{ padding: '20px 20px 16px' }}>
            <p className="section-label" style={{ marginBottom: 20 }}>Tipo de afectación</p>
            <ResponsiveContainer width="100%" height={Math.max(60, stats.distribucion_tipo.length * 48)}>
              <BarChart data={stats.distribucion_tipo} layout="vertical" barCategoryGap={10}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="tipo"
                  width={90}
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: "'DM Mono', monospace" }}
                  tickFormatter={(v) => String(v).replace(/_/g, ' ')}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{
                    background: '#0d1520',
                    border: '1px solid #1e3248',
                    borderRadius: 8,
                    fontSize: 12,
                    fontFamily: "'Chakra Petch', sans-serif",
                    color: '#e8f1f8',
                  }}
                  labelStyle={{ color: '#e8f1f8', fontWeight: 600 }}
                  itemStyle={{ color: '#7aaec8' }}
                  labelFormatter={(v) => String(v).replace(/_/g, ' ')}
                  formatter={(v) => [v, 'Casos']}
                />
                <Bar dataKey="cantidad" radius={[0, 5, 5, 0]} maxBarSize={16}>
                  {stats.distribucion_tipo.map((entry: any) => (
                    <Cell key={entry.tipo} fill={TIPO_COLOR[entry.tipo] ?? 'var(--accent)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary */}
          <div className="card" style={{ padding: '20px 20px 16px' }}>
            <p className="section-label" style={{ marginBottom: 22 }}>Resumen de llamadas</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {[
                { label: 'Completadas',  value: stats.completadas,  color: 'var(--success)', total: stats.total_llamadas },
                { label: 'No contestó', value: stats.no_contesto,  color: 'var(--warning)', total: stats.total_llamadas },
              ].map((item) => {
                const pct = item.total ? Math.round((item.value / item.total) * 100) : 0
                return (
                  <div key={item.label}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: item.color,
                            boxShadow: `0 0 8px ${item.color}`,
                          }}
                        />
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span
                          className="mono page-eyebrow"
                          style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1 }}
                        >
                          {item.value}
                        </span>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${pct}%`, background: item.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Services ── */}
      <div className="card animate-fade-in-4" style={{ padding: '20px 24px' }}>
        <p className="section-label" style={{ marginBottom: 16 }}>Servicios externos</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {(health
            ? Object.entries(health.servicios)
            : ['twilio', 'azure_tts', 'deepgram', 'deepseek'].map((s) => [s, { status: 'loading' }])
          ).map(([nombre, srv]: any) => (
            <div
              key={nombre}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'var(--bg-primary)',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 500,
                  textTransform: 'capitalize',
                }}
              >
                {SERVICIO_ICON[nombre] ?? <Server size={13} />}
                {String(nombre).replace('_', ' ')}
              </div>
              <StatusBadge status={srv.status === 'ok' ? 'ok' : srv.status === 'loading' ? 'loading' : 'error'} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
