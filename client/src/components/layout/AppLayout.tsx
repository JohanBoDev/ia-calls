import { useState, useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, PhoneCall, Terminal, Sun, Moon, Zap, SlidersHorizontal } from 'lucide-react'

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
        <div style={{ padding: '24px 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              className="logo-glow"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Zap size={18} color="#020c14" strokeWidth={2.5} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: '0.18em',
                  color: 'var(--accent)',
                  lineHeight: 1.1,
                }}
              >
                ENEL
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: '0.28em',
                  color: 'var(--text-secondary)',
                  lineHeight: 1,
                  marginTop: 3,
                }}
              >
                AI CALLS
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0 16px 16px' }} />

        {/* Section label */}
        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.2em',
            color: 'var(--text-muted)',
            padding: '0 20px 10px',
            textTransform: 'uppercase',
          }}
        >
          Navegación
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 9,
                    cursor: 'pointer',
                    position: 'relative',
                    background: isActive ? 'var(--accent-dim)' : 'transparent',
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    letterSpacing: '0.01em',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                      e.currentTarget.style.color = 'var(--text-primary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text-secondary)'
                    }
                  }}
                >
                  {/* Active indicator */}
                  {isActive && <span className="nav-active-bar" />}

                  {/* Icon */}
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 7,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isActive ? 'var(--accent-glow)' : 'transparent',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
                  </div>

                  {label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div style={{ padding: '12px 10px 20px' }}>
          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0 6px 12px' }} />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              borderRadius: 9,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "'Syne', sans-serif",
              letterSpacing: '0.01em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {theme === 'dark' ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
            </div>
            {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          </button>

          {/* Version */}
          <div
            className="mono"
            style={{
              fontSize: 9,
              color: 'var(--text-muted)',
              padding: '10px 10px 0',
              letterSpacing: '0.08em',
            }}
          >
            v1.0 · ENEL Colombia
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
          padding: '32px 40px',
        }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
