import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from './auth'
import { api } from './api'
import { siteContent } from './data/siteContent'

export const Logo = () => (
  <div className="flex items-center">
    <img src={siteContent.brand.logo.src} alt={siteContent.brand.logo.alt} className="h-auto w-44 object-contain" />
  </div>
)

export const Card = ({ className = '', ...p }) => (
  <div className={'rounded-xl border border-navy/10 bg-white ' + className} {...p} />
)
export const Input = (p) => (
  <input {...p} className="w-full rounded-lg border border-navy/20 bg-cream/60 px-3 py-2 text-sm placeholder:text-navy/40 focus:border-navy focus:outline-none" />
)
export const Select = (p) => (
  <select {...p} className="w-full rounded-lg border border-navy/20 bg-cream/60 px-3 py-2 text-sm focus:border-navy focus:outline-none" />
)
export const Btn = ({ className = '', ...p }) => (
  <button {...p} className={'rounded-lg bg-navy px-4 py-2 text-sm font-medium text-cream transition hover:bg-navy-700 disabled:opacity-50 ' + className} />
)
export const Err = ({ msg }) =>
  msg ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</p> : null

export const AuthCard = ({ title, children }) => (
  <main id="main" tabIndex={-1} className="grid min-h-screen place-items-center px-4">
    <div className="w-full max-w-sm">
      <div className="mb-8 flex justify-center"><Logo /></div>
      <Card className="p-6">
        <h1 className="mb-5 font-sans text-2xl font-bold">{title}</h1>
        {children}
      </Card>
    </div>
  </main>
)

function usePendingCount(enabled) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    const load = () => {
      api('/auth/pending')
        .then((list) => { if (!cancelled) setCount(list.length) })
        .catch(() => {}) // stay silent in the nav badge; the Approvals page itself shows real errors
    }

    load()
    const id = setInterval(load, 30000) // refresh every 30s while the app is open
    return () => { cancelled = true; clearInterval(id) }
  }, [enabled])

  return count
}

export function Layout() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const pendingCount = usePendingCount(user.role === 'consultancy_staff')
  const link = ({ isActive }) =>
    'rounded-lg px-3 py-2 text-sm font-medium ' + (isActive ? 'bg-navy text-cream' : 'text-navy hover:bg-navy/10')
  return (
    <div className="min-h-screen">
      <header className="border-b border-navy/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Logo />
<nav className="flex gap-1">
  <NavLink to="/" className={link}>Website</NavLink>
  <NavLink to="/portal" end className={link}>Documents</NavLink>
  <NavLink to="/messages" className={link}>Messages</NavLink>
  <NavLink to="/profile" className={link}>My Profile</NavLink>
  {user.role === 'consultancy_staff' && (
    <>
      <NavLink to="/leads" className={link}>Enquiries</NavLink>
      <NavLink to="/gallery-admin" className={link}>Gallery</NavLink>
      <NavLink to="/approvals" className={link}>
        Approvals
        {pendingCount > 0 && (
          <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">
            {pendingCount}
          </span>
        )}
      </NavLink>
      <NavLink to="/users" className={link}>Users</NavLink>
      <NavLink to="/audit-log" className={link}>Audit Log</NavLink>
    </>
  )}
</nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-navy/70 sm:block">
{{ student: 'Student', principal: 'Principal', parent: 'Parent/Guardian', other: 'Other', consultancy_staff: 'Staff' }[user.role]}
            </span>
            <button onClick={() => { logout(); nav('/login') }} className="rounded-lg border border-navy/20 px-3 py-1.5 hover:bg-navy/10">
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-8"><Outlet /></main>
    </div>
  )
}
