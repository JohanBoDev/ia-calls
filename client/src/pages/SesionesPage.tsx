import { useEffect, useState } from 'react'
import { PhoneOff, Clock, MapPin, Phone, Zap, Radio } from 'lucide-react'
import { useSesionesQuery, useCancelarSesionMutation } from '@/features/sesiones/hooks/useSesionesQuery'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

const PASOS: Record<number, { label: string; color: string; bg: string }> = {
  2: { label: 'Verificando servicio', color: '#22d3ee',  bg: 'rgba(34,211,238,0.08)'  },
  3: { label: 'Preguntando sector',   color: '#a855f7',  bg: 'rgba(168,85,247,0.08)'  },
  4: { label: 'Tipo de afectación',   color: '#f59e0b',  bg: 'rgba(245,158,11,0.08)'  },
}

function useTiempoTranscurrido(creada_en: string) {
  const [segundos, setSegundos] = useState(0)

  useEffect(() => {
    const inicio = new Date(creada_en).getTime()
    const tick = () => setSegundos(Math.floor((Date.now() - inicio) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [creada_en])

  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `0:${String(s).padStart(2, '0')}`
}

function TarjetaSesion({
  s,
  onCancelar,
  cancelando,
}: {
  s: any
  onCancelar: () => void
  cancelando: boolean
}) {
  const tiempo = useTiempoTranscurrido(s.creada_en)
  const paso = PASOS[s.paso_actual] ?? {
    label: `Paso ${s.paso_actual}`,
    color: 'var(--text-secondary)',
    bg: 'rgba(255,255,255,0.04)',
  }

  return (
    <div
      className="card animate-fade-in"
      style={{
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Live pulse top border */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: 'linear-gradient(90deg, var(--success), transparent)',
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            {/* Live indicator */}
            <div
              className="animate-live"
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--success)',
                boxShadow: '0 0 6px var(--success)',
              }}
            />
            <p
              className="mono"
              style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}
            >
              {s.numero_ticket}
            </p>
          </div>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 12 }}
          >
            <Phone size={11} />
            <span className="mono">{s.telefono}</span>
          </div>
        </div>

        {/* Timer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '4px 10px',
          }}
        >
          <Clock size={11} color="var(--text-muted)" />
          <span
            className="mono"
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.05em' }}
          >
            {tiempo}
          </span>
        </div>
      </div>

      {/* Location */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 11 }}>
          <MapPin size={11} />
          <span>{s.municipio}{s.sector ? ` — ${s.sector}` : ''}</span>
        </div>
        {s.tipo_afectacion && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 11 }}>
            <Zap size={11} />
            <span style={{ textTransform: 'capitalize' }}>{s.tipo_afectacion.replace('_', ' ')}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: paso.color,
            background: paso.bg,
            border: `1px solid ${paso.color}30`,
            borderRadius: 20,
            padding: '3px 10px',
            letterSpacing: '0.02em',
          }}
        >
          {paso.label}
        </span>
        <button
          onClick={onCancelar}
          disabled={cancelando}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--error)',
            background: 'transparent',
            border: 'none',
            cursor: cancelando ? 'not-allowed' : 'pointer',
            opacity: cancelando ? 0.4 : 1,
            fontFamily: "'Syne', sans-serif",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = cancelando ? '0.4' : '1' }}
        >
          <PhoneOff size={13} />
          Colgar
        </button>
      </div>
    </div>
  )
}

export default function SesionesPage() {
  const { data: sesiones = [], isLoading, refetch } = useSesionesQuery()
  const { mutate: cancelar, isPending: cancelando } = useCancelarSesionMutation()

  useEffect(() => {
    const id = setInterval(() => refetch(), 5000)
    return () => clearInterval(id)
  }, [refetch])

  const activas = sesiones.filter((s) => !s.terminada)

  return (
    <div>
      {/* Header */}
      <div
        className="animate-fade-in"
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}
      >
        <div>
          <p
            className="mono"
            style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: 6 }}
          >
            TIEMPO REAL
          </p>
          <h1
            style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
          >
            Sesiones activas
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
          {activas.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 20,
                padding: '5px 12px',
              }}
            >
              <Radio size={12} color="var(--success)" />
              <span
                className="mono"
                style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)', letterSpacing: '0.04em' }}
              >
                {activas.length} EN VIVO
              </span>
            </div>
          )}
          <span
            className="mono"
            style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em' }}
          >
            actualiza c/5s
          </span>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : activas.length === 0 ? (
        <div
          className="card animate-fade-in"
          style={{ padding: '60px 40px', textAlign: 'center' }}
        >
          <PhoneOff size={32} color="var(--text-muted)" style={{ margin: '0 auto 14px' }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
            Sin llamadas activas
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            No hay sesiones en curso en este momento
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 14,
          }}
        >
          {activas.map((s) => (
            <TarjetaSesion
              key={s.call_sid}
              s={s}
              onCancelar={() => cancelar(s.call_sid)}
              cancelando={cancelando}
            />
          ))}
        </div>
      )}
    </div>
  )
}
