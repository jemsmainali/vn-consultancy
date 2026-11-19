import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import { AuthCard, Input, Btn, Err } from '../ui'

const RESEND_WAIT_SECONDS = 60 // matches the API's one-minute resend cooldown

// Shown after "Create account" (and at the old /verify address). The email holds a link and a fallback code.
export default function CheckInbox() {
  const { refresh } = useAuth()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const mailErr = Boolean(params.get('mailerr'))
  const [email, setEmail] = useState(params.get('email') || '')
  const [code, setCode] = useState('')
  const [showCode, setShowCode] = useState(false)
  const [err, setErr] = useState(mailErr ? "Your account was created, but we couldn't send the verification email. Use \"Resend email\" below." : '')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [wait, setWait] = useState(params.get('sent') ? RESEND_WAIT_SECONDS : 0)

  useEffect(() => {
    if (wait <= 0) return undefined
    const t = setTimeout(() => setWait(wait - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  const resend = async () => {
    setErr(''); setInfo('')
    try {
      await api('/auth/resend-verification', { method: 'POST', json: { email } })
      setInfo('A new email is on its way. Check your inbox and spam folder. Earlier links stop working.')
      setWait(RESEND_WAIT_SECONDS)
    } catch (x) { setErr(x.message) }
  }

  const submitCode = async (e) => {
    e.preventDefault(); setBusy(true); setErr(''); setInfo('')
    try {
      const res = await api('/auth/verify-email', { method: 'POST', json: { email, code } })
      await refresh()
      nav(res.pending_approval ? '/pending' : '/')
    } catch (x) { setErr(x.message) }
    setBusy(false)
  }

  return (
    <AuthCard title="Check your inbox">
      <div className="space-y-4">
        <p className="text-sm text-navy/70">
          {mailErr ? 'Request a verification email for' : "If this email can be used for a new account, we've sent a verification link to"}{' '}
          <span className="font-semibold text-navy">{email || 'your email'}</span>.
          {' '}Open it within 24 hours to confirm your address. Check your spam folder if it hasn&apos;t arrived.
        </p>
        {!mailErr && (
          <p className="text-sm text-navy/70">
            Nothing after a few minutes? You may already have an account:{' '}
            <Link to="/login" className="font-semibold text-navy underline">sign in</Link> or{' '}
            <Link to="/forgot-password" className="font-semibold text-navy underline">reset your password</Link>.
          </p>
        )}
        <Err msg={err} />
        {info && <p className="auth-notice" role="status">{info}</p>}
        {!params.get('email') && (
          <Input type="email" required autoComplete="email" placeholder="Your email address" aria-label="Your email address" value={email} onChange={(e) => setEmail(e.target.value)} />
        )}
        <Btn type="button" variant="secondary" className="w-full" onClick={resend} disabled={wait > 0 || !email}>
          {wait > 0 ? `Resend email in ${wait}s` : 'Resend email'}
        </Btn>
      </div>

      <div className="mt-6 border-t border-cream-deep pt-4">
        {showCode ? (
          <form onSubmit={submitCode} className="space-y-3">
            <label className="block text-sm font-semibold text-navy" htmlFor="verify-code">6-digit code from the email</label>
            <Input
              id="verify-code" required inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} placeholder="000000"
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
            <p className="text-xs text-navy/60">The code works for 10 minutes. Use the link if it has expired.</p>
            <Btn className="w-full" disabled={busy || code.length !== 6 || !email}>{busy ? 'Verifying...' : 'Verify with code'}</Btn>
          </form>
        ) : (
          <button type="button" className="text-sm font-semibold text-navy underline underline-offset-2" onClick={() => setShowCode(true)}>
            Enter the 6-digit code instead
          </button>
        )}
      </div>

      <Link to="/login" className="mt-6 block text-center text-sm text-navy/70 underline">Back to sign in</Link>
    </AuthCard>
  )
}
