import { createContext, useContext, useEffect, useState } from 'react'
import { api, logout as apiLogout } from './api'

const Ctx = createContext()
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadMe = async () => {
    try { setUser(await api('/auth/me')) } catch { setUser(null) }
    setLoading(false)
  }
  useEffect(() => { loadMe() }, [])

  const login = async (email, password) => {
    await api('/auth/login', { method: 'POST', json: { email, password } })
    await loadMe()
  }
  const logout = async () => {
    try { await apiLogout() } catch { /* cookie may already be gone - fine either way */ }
    setUser(null)
  }

  return <Ctx.Provider value={{ user, loading, login, logout, refresh: loadMe }}>{children}</Ctx.Provider>
}