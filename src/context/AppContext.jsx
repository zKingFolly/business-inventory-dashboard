import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { clearCache } from '../api/query'
import { TOKEN_KEY } from '../api/http'

const AppContext = createContext(null)

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem('kobo-user'))
  } catch {
    return null
  }
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => (localStorage.getItem(TOKEN_KEY) ? readUser() : null))
  const [businessId, setBusinessIdState] = useState(() => localStorage.getItem('kobo-business'))
  const [theme, setThemeState] = useState(() => localStorage.getItem('kobo-theme') || 'system')

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () =>
      document.documentElement.setAttribute('data-theme', theme === 'system' ? (media.matches ? 'dark' : 'light') : theme)
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('kobo-user')
    setUser(null)
    clearCache()
  }, [])

  useEffect(() => {
    window.addEventListener('kobo:unauthorized', logout)
    return () => window.removeEventListener('kobo:unauthorized', logout)
  }, [logout])

  const login = useCallback(async (credentials) => {
    const { token, user: nextUser } = await api.login(credentials)
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem('kobo-user', JSON.stringify(nextUser))
    setUser(nextUser)
  }, [])

  const setBusinessId = useCallback((id) => {
    localStorage.setItem('kobo-business', id)
    setBusinessIdState(id)
  }, [])

  const setTheme = useCallback((next) => {
    localStorage.setItem('kobo-theme', next)
    setThemeState(next)
  }, [])

  const value = useMemo(
    () => ({ user, login, logout, businessId, setBusinessId, theme, setTheme }),
    [user, login, logout, businessId, setBusinessId, theme, setTheme],
  )
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
