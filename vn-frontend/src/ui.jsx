import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './auth'
import { api } from './api'
import { siteContent } from './data/siteContent'
import ConfirmDialog from './components/ui/ConfirmDialog'
import HomeLink from './components/layout/HomeLink'

export const Logo = () => (
  <div className="flex items-center">
    <img src={siteContent.brand.logo.src} alt={siteContent.brand.logo.alt} className="h-auto w-44 object-contain" />
  </div>
)

export const ROLE_LABEL = {
  student: 'Student', principal: 'Principal', parent: 'Parent/Guardian', other: 'Other', consultancy_staff: 'VN Group Staff',
}

// ---------- Primitives ----------

export const Card = ({ className = '', ...p }) => (
  <div className={'ui-card ' + className} {...p} />
)
export const Input = ({ className = '', ...p }) => (
  <input {...p} className={'ui-input ' + className} />
)
export const Select = ({ className = '', ...p }) => (
  <select {...p} className={'ui-input ui-select ' + className} />
)
export const Btn = ({ className = '', variant = 'primary', size = '', ...p }) => (
  <button {...p} className={`ui-btn ui-btn--${variant}${size ? ` ui-btn--${size}` : ''} ${className}`} />
)
export const Err = ({ msg, onRetry, busy = false }) =>
  msg ? <div className="ui-alert ui-alert--error" role="alert">
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 4.5v4m0 2h.01"/></svg>
    <span className="flex-1">{msg}</span>
    {onRetry && <button type="button" className="font-semibold underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-gold" onClick={onRetry} disabled={busy}>{busy ? 'Retrying…' : 'Retry'}</button>}
  </div> : null

export const Field = ({ label, hint, className = '', children }) => (
  <label className={'ui-field ' + className}>
    <span className="ui-label">{label}</span>
    {children}
    {hint && <span className="ui-hint">{hint}</span>}
  </label>
)

const ICONS = {
  documents: <><path d="M7 3.75h6.5L18 8.25v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-14.5a1 1 0 0 1 1-1Z"/><path d="M13.25 3.75V8.5H18M9 12.5h6M9 16h4"/></>,
  messages: <><path d="M4.75 6.25a2 2 0 0 1 2-2h10.5a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H11l-4.25 3.5V16.25h0a2 2 0 0 1-2-2Z"/><path d="M8.5 9.25h7M8.5 12.25h4.5"/></>,
  profile: <><circle cx="12" cy="8.5" r="3.75"/><path d="M4.75 19.5c1.25-3.5 4-5.25 7.25-5.25s6 1.75 7.25 5.25"/></>,
  website: <><circle cx="12" cy="12" r="8.25"/><path d="M3.75 12h16.5M12 3.75c2.25 2.5 3.25 5.25 3.25 8.25S14.25 17.75 12 20.25M12 3.75C9.75 6.25 8.75 9 8.75 12s1 5.75 3.25 8.25"/></>,
  inbox: <><path d="M4.25 13.25 6.5 5.5a1.5 1.5 0 0 1 1.45-1.1h8.1a1.5 1.5 0 0 1 1.45 1.1l2.25 7.75v5a1.5 1.5 0 0 1-1.5 1.5H5.75a1.5 1.5 0 0 1-1.5-1.5Z"/><path d="M4.25 13.25h4.5l1 2h4.5l1-2h4.5"/></>,
  image: <><rect x="3.75" y="4.75" width="16.5" height="14.5" rx="2"/><circle cx="9" cy="9.75" r="1.75"/><path d="m4.5 17.5 4.75-4.5 3.5 3 3-2.5 3.75 3.5"/></>,
  approve: <><path d="M12 3.75 18.75 6.5v5c0 4.25-2.75 7.25-6.75 8.75-4-1.5-6.75-4.5-6.75-8.75v-5Z"/><path d="m9 12 2.1 2.1L15.25 10"/></>,
  users: <><circle cx="9" cy="8.75" r="3.25"/><path d="M3.5 19c.9-3 3-4.5 5.5-4.5s4.6 1.5 5.5 4.5"/><path d="M15.25 5.75a3.25 3.25 0 0 1 0 6.25M17 14.75c1.75.5 3 1.9 3.5 4.25"/></>,
  audit: <><circle cx="12" cy="12" r="8.25"/><path d="M12 7.5V12l3 2"/></>,
  menu: <path d="M4.5 7h15M4.5 12h15M4.5 17h15"/>,
  close: <path d="m6.5 6.5 11 11m0-11-11 11"/>,
  logout: <><path d="M14.5 4.75H17a1.5 1.5 0 0 1 1.5 1.5v11.5a1.5 1.5 0 0 1-1.5 1.5h-2.5"/><path d="M10.5 8.25 6.75 12l3.75 3.75M6.75 12h9"/></>,
  upload: <path d="M12 15.5V5m0 0L8.25 8.75M12 5l3.75 3.75M5 15v2.75a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V15"/>,
  send: <path d="M4.5 12 19.5 4.75 15.5 19.5l-3.25-6.25Zm7.75 1.25L19.5 4.75"/>,
  eye: <><path d="M2.75 12s3.25-6.25 9.25-6.25S21.25 12 21.25 12 18 18.25 12 18.25 2.75 12 2.75 12Z"/><circle cx="12" cy="12" r="2.5"/></>,
  edit: <><path d="m14.75 5.5 3.75 3.75M5 19l1-4.25L15.75 5a1.75 1.75 0 0 1 2.5 0l.75.75a1.75 1.75 0 0 1 0 2.5L9.25 18Z"/></>,
  trash: <><path d="M5 7h14M10 7V5.25h4V7M7 7l.75 12h8.5L17 7"/></>,
  refresh: <><path d="M19 12a7 7 0 1 1-2.05-4.95"/><path d="M19 5v4h-4"/></>,
  search: <><circle cx="11" cy="11" r="6.25"/><path d="m16 16 3.75 3.75"/></>,
  check: <path d="m5.5 12.5 4 4 9-9"/>,
  chevronLeft: <path d="M14.5 6 8.5 12l6 6"/>,
  chevronRight: <path d="m9.5 6 6 6-6 6"/>,
  lock: <><rect x="5.5" y="10.5" width="13" height="9" rx="1.75"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></>,
}

export const Icon = ({ name, className = '' }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={'ui-icon ' + className}>{ICONS[name]}</svg>
)

export const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || '?'

export const Avatar = ({ name, src, size = 'md' }) => (
  <span className={`ui-avatar ui-avatar--${size}`} aria-hidden="true">
    {src ? <img src={src} alt="" /> : initials(name)}
  </span>
)

export const PageHeader = ({ eyebrow, title, description, actions }) => (
  <header className="ui-page-header">
    <div className="ui-page-header-copy">
      {eyebrow && <p className="ui-eyebrow">{eyebrow}</p>}
      <h1 className="ui-page-title">{title}</h1>
      {description && <p className="ui-page-description">{description}</p>}
    </div>
    {actions && <div className="ui-page-actions">{actions}</div>}
  </header>
)

export const StatusBadge = ({ tone = 'neutral', children }) => (
  <span className={`ui-badge ui-badge--${tone}`}><span className="ui-badge-dot" aria-hidden="true" />{children}</span>
)

export const EmptyState = ({ icon = 'documents', title, children }) => (
  <div className="ui-empty">
    <span className="ui-empty-icon"><Icon name={icon} /></span>
    <p className="ui-empty-title">{title}</p>
    {children && <p className="ui-empty-text">{children}</p>}
  </div>
)

export const Pagination = ({ page, totalPages, total, pageSize, onPage, disabled = false }) => (
  <nav className="ui-pagination" aria-label="Pagination">
    <span className="ui-pagination-summary">
      {total > 0 ? <>Showing <strong>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}</strong> of <strong>{total}</strong></> : 'No results'}
    </span>
    <div className="ui-pagination-controls">
      <Btn type="button" variant="secondary" size="sm" onClick={() => onPage(page - 1)} disabled={disabled || page <= 1}>
        <Icon name="chevronLeft" />Previous
      </Btn>
      <span className="ui-pagination-page">Page {page} of {totalPages}</span>
      <Btn type="button" variant="secondary" size="sm" onClick={() => onPage(page + 1)} disabled={disabled || page >= totalPages}>
        Next<Icon name="chevronRight" />
      </Btn>
    </div>
  </nav>
)

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

// ---------- Portal shell ----------

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
    const id = setInterval(() => { if (!document.hidden) load() }, 30000) // refresh every 30s while the tab is visible
    const onVisible = () => { if (!document.hidden) load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { cancelled = true; clearInterval(id); document.removeEventListener('visibilitychange', onVisible) }
  }, [enabled])

  return count
}

const WORKSPACE_LINKS = [
  { to: '/portal', label: 'Documents', icon: 'documents', end: true },
  { to: '/messages', label: 'Messages', icon: 'messages' },
  { to: '/profile', label: 'My Profile', icon: 'profile' },
]
const STUDENT_LINKS = [
  { to: '/study-plan', label: 'Study Plan', icon: 'check' },
  { to: '/universities', label: 'Universities', icon: 'search' },
  { to: '/applications', label: 'Applications', icon: 'send' },
  { to: '/visa', label: 'Visa preparation', icon: 'approve' },
]
const STAFF_LINKS = [
  { to: '/leads', label: 'Enquiries', icon: 'inbox' },
  { to: '/gallery-admin', label: 'Gallery', icon: 'image' },
  { to: '/approvals', label: 'Approvals', icon: 'approve', badge: true },
  { to: '/users', label: 'Users', icon: 'users' },
  { to: '/audit-log', label: 'Audit Log', icon: 'audit' },
]

function NavItem({ link, badge }) {
  return (
    <NavLink to={link.to} end={link.end} className={({ isActive }) => 'portal-nav-link' + (isActive ? ' is-active' : '')}>
      <Icon name={link.icon} />
      <span className="portal-nav-label">{link.label}</span>
      {badge > 0 && <><span className="portal-nav-badge" aria-hidden="true">{badge}</span><span className="sr-only">, {badge} pending</span></>}
    </NavLink>
  )
}

const DESKTOP_QUERY = '(min-width: 1024px)' // keep in sync with the sidebar breakpoint in portal.css

export function Layout() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const staff = user.role === 'consultancy_staff'
  const pendingCount = usePendingCount(staff)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [desktop, setDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches)
  const sidebarRef = useRef(null)
  const menuButtonRef = useRef(null)

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY)
    const onChange = () => { setDesktop(query.matches); if (query.matches) setMenuOpen(false) }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!menuOpen) return undefined
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Wait a frame so React has removed `inert` before moving focus into the drawer.
    const frame = requestAnimationFrame(() => sidebarRef.current?.querySelector('a, button')?.focus())
    const onKey = (event) => {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      menuButtonRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => { cancelAnimationFrame(frame); document.body.style.overflow = oldOverflow; document.removeEventListener('keydown', onKey) }
  }, [menuOpen])

  return (
    <div className="portal-shell">
      <ConfirmDialog open={confirmLogout} title="Sign out?" message="You will need to sign in again to access your account." confirmLabel="Sign out" danger onCancel={() => setConfirmLogout(false)} onConfirm={async () => { await logout(); setConfirmLogout(false); nav('/login') }} />

      <header className="portal-topbar">
        <HomeLink className="portal-topbar-logo" aria-label="VN Group home">
          <img src={siteContent.brand.logo.src} alt="" width="132" height="56" />
        </HomeLink>
        <button ref={menuButtonRef} type="button" className="portal-menu-button" aria-expanded={menuOpen} aria-controls="portal-sidebar" onClick={() => setMenuOpen((open) => !open)}>
          <Icon name={menuOpen ? 'close' : 'menu'} />
          <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}{staff && pendingCount > 0 && !menuOpen ? `, ${pendingCount} pending ${pendingCount === 1 ? 'approval' : 'approvals'}` : ''}</span>
          {staff && pendingCount > 0 && !menuOpen && <span className="portal-menu-dot" aria-hidden="true" />}
        </button>
      </header>

      <button type="button" className={`portal-scrim${menuOpen ? ' is-visible' : ''}`} aria-hidden="true" tabIndex={-1} onClick={() => setMenuOpen(false)} />

      <aside id="portal-sidebar" ref={sidebarRef} className={`portal-sidebar${menuOpen ? ' is-open' : ''}`} aria-label="Portal navigation" {...(!desktop && !menuOpen ? { inert: '' } : {})}>
        <HomeLink className="portal-sidebar-logo" aria-label="VN Group home">
          <img src={siteContent.brand.logo.src} alt="" width="168" height="71" />
        </HomeLink>

        <nav className="portal-nav">
          <p className="portal-nav-heading">Workspace</p>
          {WORKSPACE_LINKS.map((link) => <NavItem key={link.to} link={link} />)}
          {user.role === 'student' && <>
            <p className="portal-nav-heading">Study abroad</p>
            {STUDENT_LINKS.map((link) => <NavItem key={link.to} link={link} />)}
          </>}
          {staff && <>
            <p className="portal-nav-heading">Staff tools</p>
            {STAFF_LINKS.map((link) => <NavItem key={link.to} link={link} badge={link.badge ? pendingCount : 0} />)}
          </>}
        </nav>

        <div className="portal-sidebar-footer">
          <NavLink to="/" className="portal-nav-link portal-nav-link--muted">
            <Icon name="website" /><span className="portal-nav-label">Back to website</span>
          </NavLink>
          <div className="portal-user">
            <Avatar name={user.full_name} size="sm" />
            <span className="portal-user-text">
              <span className="portal-user-name">{user.full_name}</span>
              <span className="portal-user-role">{ROLE_LABEL[user.role]}</span>
            </span>
            <button type="button" className="portal-signout" title="Sign out" onClick={() => setConfirmLogout(true)}>
              <Icon name="logout" /><span className="sr-only">Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      <main id="main" tabIndex={-1} className="portal-main">
        <div className="portal-content" key={location.pathname}><Outlet /></div>
      </main>
    </div>
  )
}
