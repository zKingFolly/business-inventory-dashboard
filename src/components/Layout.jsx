import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, Receipt, Sparkles, LogOut, Menu, X, Moon, Sun, Monitor } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useBusinesses } from '../api/hooks'
import { ASSISTANT_NAME } from '../config'
import Logo from './Logo'
import { isMock } from '../api'

const links = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/sales', label: 'Sales', icon: Receipt },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/assistant', label: ASSISTANT_NAME, icon: Sparkles },
]

const themeCycle = { system: 'light', light: 'dark', dark: 'system' }
const themeIcon = { system: Monitor, light: Sun, dark: Moon }

export function BusinessSwitcher() {
  const { businessId, setBusinessId } = useApp()
  const { data: businesses } = useBusinesses()

  useEffect(() => {
    if (businesses?.length && !businesses.some((b) => b.id === businessId)) setBusinessId(businesses[0].id)
  }, [businesses, businessId, setBusinessId])

  return (
    <>
      <label className="sr-only" htmlFor="business">
        Business
      </label>
      <select
        id="business"
        className="select"
        value={businessId || ''}
        onChange={(e) => setBusinessId(e.target.value)}
      >
        {(businesses || []).map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </>
  )
}

export default function Layout() {
  const { logout, theme, setTheme, user } = useApp()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const ThemeIcon = themeIcon[theme]

  useEffect(() => setOpen(false), [location.pathname])

  return (
    <div className="shell">
      <header className="mobile-bar">
        <Logo style={{ padding: 0 }} />
        <button onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu size={20} />
        </button>
      </header>

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <Logo>
          {open && (
            <button
              className="nav-button"
              style={{ marginLeft: 'auto', width: 36 }}
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </Logo>
        <nav className="nav" aria-label="Main">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="nav-link">
              <Icon size={16} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-spacer" />
        {isMock && <p className="label" style={{ padding: '0 10px 8px' }}>Demo data (no backend connected)</p>}
        <button className="nav-button" onClick={() => setTheme(themeCycle[theme])}>
          <ThemeIcon size={16} aria-hidden="true" />
          Theme: {theme}
        </button>
        <button className="nav-button" onClick={logout}>
          <LogOut size={16} aria-hidden="true" />
          Sign out{user?.name ? ` (${user.name})` : ''}
        </button>
      </aside>

      <main className="main">
        <Outlet />
      </main>

      <nav className="tab-bar" aria-label="Primary">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="tab-link">
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
