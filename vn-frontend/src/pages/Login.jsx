import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { Err } from '../ui'
import { siteContent, siteContentReady, yearsOfExperience } from '../data/siteContent'
import PasswordInput from '../components/ui/PasswordInput'
import AuthLayout, { AuthAside } from '../components/auth/AuthLayout'
import AuthField from '../components/auth/AuthField'

const { contact } = siteContent
const supportNumber = siteContentReady(contact.phone) ? contact.phone : ''
const whatsappNumber = siteContentReady(contact.whatsappNumber) ? contact.whatsappNumber.replace(/\D/g, '') : ''
const supportEmail = siteContentReady(contact.email) ? contact.email : ''

function ContactIcon({ type }) {
  if (type === 'Call') {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 3.75h3l1.5 4.5-2 1.5a15 15 0 0 0 7.25 7.25l1.5-2 4.5 1.5v3c0 .83-.67 1.5-1.5 1.5A16.5 16.5 0 0 1 3 5.25c0-.83.67-1.5 1.5-1.5Z" /></svg>
  }
  if (type === 'WhatsApp') {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 11.75a8.25 8.25 0 0 1-12.2 7.25L3 20.25l1.25-4.8A8.25 8.25 0 1 1 20.25 11.75Z"/><path strokeLinecap="round" strokeLinejoin="round" d="M8.5 8.25c.5 2.75 2 4.25 4.75 5l1-1 2 .75c-.25 1-1 1.75-2 1.75-3.75-.25-6.75-3.25-7-7 0-1 .75-1.75 1.75-2l.75 2-1.25.5Z"/></svg>
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3.25" y="5.25" width="17.5" height="13.5" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 7 7.5 5.75L19.5 7"/></svg>
}

function ContactLink({ href, type, label, external = false }) {
  return (
    <a className="auth-help-link" href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      <ContactIcon type={type} />
      {label}
      {external && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  )
}

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [f, setF] = useState({ email: '', password: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const previousTitle = document.title
    const description = document.querySelector('meta[name="description"]')
    const previousDescription = description?.content
    document.title = 'Login | VN Group'
    if (description) description.content = 'Log in to your VN Group account.'
    return () => {
      document.title = previousTitle
      if (description && previousDescription !== undefined) description.content = previousDescription
    }
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      await login(f.email, f.password)
      nav('/')
    } catch (x) {
      setErr(x.message)
    } finally {
      setBusy(false)
    }
  }

  const hasHelp = supportNumber || whatsappNumber || supportEmail

  return (
    <AuthLayout
      variant="login"
      aside={(
        <AuthAside
          eyebrow={`Guiding students since ${siteContent.brand.foundedYear}`}
          title={siteContent.login.heroTitle}
          description="Sign in to share documents, message your counsellor and follow every step of your application in one place."
          points={[
            `${yearsOfExperience()}+ years of study abroad guidance`,
            'Counselling, admissions and visa filing support',
            'Documents and messages kept in a secure portal',
          ]}
        />
      )}
    >
      <div className="auth-heading">
        <p className="auth-kicker">Welcome back</p>
        <h1 className="auth-title">Log in to your account</h1>
        <p className="auth-intro">Use your registered email and password to continue.</p>
      </div>

      <form onSubmit={submit} className="auth-form auth-stack">
        <Err msg={err} />
        {err.toLowerCase().includes('verify your email') && (
          <Link to={`/verify?email=${encodeURIComponent(f.email)}`} className="auth-notice auth-notice--link">
            Enter your verification code
          </Link>
        )}
        {err.toLowerCase().includes('awaiting approval') && (
          <p className="auth-notice">
            Your account is waiting for approval from VN Group staff. You&apos;ll receive an email when it&apos;s approved.
          </p>
        )}
        <AuthField label="Email address">
          <input className="auth-input" type="email" name="email" autoComplete="email" required placeholder="you@example.com" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </AuthField>
        <div className="auth-field">
          <div className="auth-label-row">
            <label className="auth-label" htmlFor="login-password">Password</label>
            <Link to="/forgot-password" className="auth-text-link">Forgot password?</Link>
          </div>
          <PasswordInput id="login-password" wrapperClassName="auth-password" className="auth-input" name="password" autoComplete="current-password" required placeholder="Enter your password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        </div>
        <button type="submit" className="auth-submit" disabled={busy} aria-busy={busy}>
          {busy ? <><span className="auth-spinner" aria-hidden="true" />Logging in…</> : 'Log in'}
        </button>
      </form>

      <p className="auth-switch">
        New to VN Group? <Link to="/register" className="auth-text-link auth-text-link--strong">Create an account</Link>
      </p>

      {hasHelp && (
        <div className="auth-help">
          <p className="auth-help-title">Trouble signing in? Contact our team</p>
          <div className="auth-help-links">
            {supportNumber && <ContactLink href={`tel:${supportNumber}`} type="Call" label="Call" />}
            {whatsappNumber && <ContactLink href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(contact.signInHelpMessage)}`} type="WhatsApp" label="WhatsApp" external />}
            {supportEmail && <ContactLink href={`mailto:${supportEmail}?subject=${encodeURIComponent('Sign-in help')}`} type="Email" label="Email" />}
          </div>
        </div>
      )}
    </AuthLayout>
  )
}
