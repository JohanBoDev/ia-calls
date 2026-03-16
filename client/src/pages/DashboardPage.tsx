import { Phone, Activity, Users, Server, Mic, Zap, Bot, PhoneCall, Terminal, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useHealthQuery } from '@/features/llamadas/hooks/useHealthQuery'
import { useIniciarLlamadasMutation } from '@/features/llamadas/hooks/useLlamadasMutation'
import { useStatsQuery } from '@/features/stats/hooks/useStatsQuery'
import { useSesionesQuery } from '@/features/sesiones/hooks/useSesionesQuery'
import { StatusBadge } from '@/components/shared/StatusBadge'

const SERVICIO_ICON: Record<string, React.ReactNode> = {
  twilio:    <Phone size={14} />,
  azure_tts: <Mic size={14} />,
  deepgram:  <Zap size={14} />,
  deepseek:  <Bot size={14} />,
}

const TIPO_COLOR: Record<string, string> = {
  falla_total:  '#ef4444',
  luz_bajita:   '#f59e0b',
  microcortes:  '#22d3ee',
}

export default function DashboardPage() {
  const { data: health, isLoading: loadingHealth } = useHealthQuery()
  const { data: stats, isLoading: loadingStats } = useStatsQuery()
  const { data: sesiones = [] } = useSesionesQuery()
  const { mutate: iniciar, isPending } = useIniciarLlamadasMutation()

  const globalStatus = loadingHealth ? 'loading' : health?.status === 'ok' ? 'ok' : 'degraded'
  const sesionesActivas = sesiones.filter((s) => !s.terminada).length

  const metrics = [
    {
      label: 'Total tickets',
      value: stats?.total_tickets ?? '—',
      icon: <Users size={16} />,
      color: 'var(--accent)',
      delay: 'animate-fade-in',
    },
    {
      label: 'Total llamadas',
      value: stats?.total_llamadas ?? '—',
      icon: <Phone size={16} />,
      color: 'var(--amber)',
      delay: 'animate-fade-in-2',
    },
    {
      label: 'Completadas',
      value: stats?.completadas ?? '—',
      icon: <Activity size={16} />,
      color: 'var(--success)',
      delay: 'animate-fade-in-3',
    },
    {
      label: '% Completada',
      value: stats ? `${stats.pct_completada}%` : '—',
      icon: <TrendingUp size={16} />,
      color: '#a855f7',
      delay: 'animate-fade-in-4',
    },
  ]

  return (
    <div>
      {/* ── Header ── */}
      <div
        className="animate-fade-in"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 32,
        }}
      >
        <div>
          <p
            className="mono"
            style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: 6 }}
          >
            PANEL DE CONTROL
          </p>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: '-0.01em',
              color: 'var(--text-primary)',
              lineHeight: 1.1,
            }}
          >
            ENEL AI Calls
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <StatusBadge status={globalStatus} />
            {sesionesActivas > 0 && (
              <span
                className="mono animate-live"
                style={{
                  fontSize: 10,
                  color: 'var(--success)',
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: 20,
                  padding: '2px 8px',
                  letterSpacing: '0.08em',
                }}
              >
                ● {sesionesActivas} EN VIVO
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => iniciar()}
          disabled={isPending || globalStatus === 'loading'}
          className="btn-accent"
          style={{ padding: '12px 24px', fontSize: 13 }}
        >
          <Phone size={16} strokeWidth={2.5} />
          {isPending ? 'Iniciando...' : 'Iniciar llamadas'}
        </button>
      </div>

      {/* ── Metrics ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
          marginBottom: 24,
        }}
      >
        {metrics.map((m) => (
          <div key={m.label} className={`metric-card ${m.delay}`} style={{ padding: '20px 20px 18px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                }}
              >
                {m.label}
              </span>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${m.color}18`,
                  color: m.color,
                }}
              >
                {m.icon}
              </div>
            </div>
            <p
              className="mono"
              style={{
                fontSize: 32,
                fontWeight: 600,
                color: loadingStats ? 'var(--text-muted)' : 'var(--text-primary)',
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {loadingStats ? '—' : m.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Nav cards ── */}
      <div
        className="animate-fade-in-2"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}
      >
        {[
          {
            to: '/clientes',
            icon: <Users size={18} style={{ color: 'var(--accent)' }} />,
            label: 'Tickets',
            sub: 'Historial de llamadas',
            accent: 'var(--accent)',
          },
          {
            to: '/sesiones',
            icon: <PhoneCall size={18} style={{ color: 'var(--success)' }} />,
            label: 'Sesiones activas',
            sub: `${sesionesActivas} en curso`,
            accent: 'var(--success)',
          },
          {
            to: '/logs',
            icon: <Terminal size={18} style={{ color: 'var(--text-secondary)' }} />,
            label: 'Logs',
            sub: 'Stream en tiempo real',
            accent: 'var(--text-secondary)',
          },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            style={{ textDecoration: 'none' }}
            className="card card-hover"
          >
            <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: `${item.accent}12`,
                  border: `1px solid ${item.accent}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {item.label}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.sub}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Charts ── */}
      {stats && stats.distribucion_tipo.length > 0 && (
        <div
          className="animate-fade-in-3"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}
        >
          {/* Bar chart */}
          <div className="card" style={{ padding: '20px 20px 16px' }}>
            <p
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
                marginBottom: 18,
              }}
            >
              Tipo de afectación
            </p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={stats.distribucion_tipo} layout="vertical" barCategoryGap={10}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="tipo"
                  width={95}
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                  tickFormatter={(v) => String(v).replace(/_/g, ' ')}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 11,
                    fontFamily: "'Syne', sans-serif",
                    color: 'var(--text-primary)',
                  }}
                  labelFormatter={(v) => String(v).replace(/_/g, ' ')}
                  formatter={(v) => [v, 'Casos']}
                />
                <Bar dataKey="cantidad" radius={[0, 6, 6, 0]} maxBarSize={18}>
                  {stats.distribucion_tipo.map((entry) => (
                    <Cell key={entry.tipo} fill={TIPO_COLOR[entry.tipo] ?? 'var(--accent)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary */}
          <div className="card" style={{ padding: '20px 20px 16px' }}>
            <p
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
                marginBottom: 20,
              }}
            >
              Resumen de llamadas
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { label: 'Completadas',  value: stats.completadas, color: 'var(--success)', total: stats.total_llamadas },
                { label: 'No contestó', value: stats.no_contesto, color: 'var(--warning)', total: stats.total_llamadas },
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
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: item.color,
                            boxShadow: `0 0 6px ${item.color}`,
                          }}
                        />
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span
                          className="mono"
                          style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}
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
        <p
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            marginBottom: 18,
          }}
        >
          Servicios externos
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {health
            ? Object.entries(health.servicios).map(([nombre, srv]) => (
                <div
                  key={nombre}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    padding: '12px 14px',
                    background: 'var(--bg-primary)',
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      color: 'var(--text-secondary)',
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  >
                    {SERVICIO_ICON[nombre] ?? <Server size={14} />}
                    {nombre.replace('_', ' ')}
                  </div>
                  <StatusBadge status={srv.status === 'ok' ? 'ok' : 'error'} />
                </div>
              ))
            : ['twilio', 'azure_tts', 'deepgram', 'deepseek'].map((s) => (
                <div
                  key={s}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    padding: '12px 14px',
                    background: 'var(--bg-primary)',
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      color: 'var(--text-secondary)',
                      fontSize: 12,
                    }}
                  >
                    {SERVICIO_ICON[s]} {s.replace('_', ' ')}
                  </div>
                  <StatusBadge status="loading" />
                </div>
              ))}
        </div>
      </div>
    </div>
  )
}
