import { useState, useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, PhoneCall, Terminal, Sun, Moon, BrainCircuit, SlidersHorizontal } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',         icon: LayoutDashboard,   label: 'Dashboard', exact: true },
  { to: '/clientes', icon: Users,             label: 'Tickets'              },
  { to: '/sesiones', icon: PhoneCall,         label: 'Sesiones'             },
  { to: '/logs',     icon: Terminal,          label: 'Logs'                 },
  { to: '/gesi',     icon: SlidersHorizontal, label: 'GESI'                 },
]

export function AppLayout() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') ?? 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ── */}
      <aside
        style={{
          width: 'var(--sidebar-width)',
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border-subtle)',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
        }}
      >
        {/* Logo */}
        <div style={{ padding: '28px 20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              className="logo-glow"
              style={{
                width: 38,
                height: 38,
                borderRadius: 9,
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <BrainCircuit size={20} color="#030f08" strokeWidth={2.5} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: '#ffffff',
                  lineHeight: 1.1,
                  textTransform: 'uppercase',
                }}
              >
                MORPHEO
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: '0.3em',
                  color: 'var(--accent)',
                  lineHeight: 1,
                  marginTop: 3,
                  textTransform: 'uppercase',
                }}
              >
                AI VOICE
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0 20px 20px' }} />

        {/* Section label */}
        <div
          className="mono"
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.22em',
            color: 'var(--text-muted)',
            padding: '0 20px 12px',
            textTransform: 'uppercase',
          }}
        >
          Sistema
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              style={{ textDecoration: 'none' }}
            >
              {({ isActive }) => (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    padding: '9px 11px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    position: 'relative',
                    background: isActive ? 'rgba(34,211,238,0.07)' : 'transparent',
                    color: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.42)',
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    letterSpacing: '0.04em',
                    transition: 'all 0.15s ease',
                    border: isActive ? '1px solid rgba(34,211,238,0.15)' : '1px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.color = 'rgba(255,255,255,0.85)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'rgba(255,255,255,0.42)'
                    }
                  }}
                >
                  {isActive && <span className="nav-active-bar" />}
                  <Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
                  {label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div style={{ padding: '12px 12px 24px' }}>
          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0 4px 12px' }} />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: '9px 11px',
              borderRadius: 8,
              background: 'transparent',
              border: '1px solid transparent',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.35)',
              fontSize: 13,
              fontWeight: 400,
              fontFamily: "'Chakra Petch', sans-serif",
              letterSpacing: '0.04em',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'rgba(255,255,255,0.35)'
            }}
          >
            {theme === 'dark'
              ? <Sun size={15} strokeWidth={1.8} style={{ flexShrink: 0 }} />
              : <Moon size={15} strokeWidth={1.8} style={{ flexShrink: 0 }} />
            }
            {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          </button>

          {/* Version */}
          <div
            className="mono"
            style={{
              fontSize: 9,
              color: 'var(--text-muted)',
              padding: '12px 11px 0',
              letterSpacing: '0.1em',
            }}
          >
            v1.0 · Morpheo
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main
        className="animate-fade-in"
        style={{
          marginLeft: 'var(--sidebar-width)',
          flex: 1,
          minHeight: '100vh',
          padding: '36px 44px',
        }}
      >
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
