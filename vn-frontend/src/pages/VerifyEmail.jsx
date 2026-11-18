import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { AuthCard, Input, Btn, Err } from '../ui'

// Landing page for the link in the verification email: /verify-email?token=...
export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [state, setState] = useState(token ? 'verifying' : 'error')
  const [result, setResult] = useState(null)
  const [err, setErr] = useState(token ? '' : 'This verification link is incomplete. Request a new one below.')
  const [email, setEmail] = useState('')
  const [info, setInfo] = useState('')
  const sent = useRef(false)

  useEffect(() => {
    // Tokens are single-use: React StrictMode runs effects twice in development, so send it only once.
    if (!token || sent.current) return
    sent.current = true
    api('/auth/verify-email', { method: 'POST', json: { token } })
      .then((res) => { setResult(res); setState('done') })
      .catch((x) => { setErr(x.message); setState('error') })
  }, [token])

  const resend = async (e) => {
    e.preventDefault(); setErr(''); setInfo('')
    try {
      const res = await api('/auth/resend-verification', { method: 'POST', json: { email } })
      setInfo(res.message)
    } catch (x) { setErr(x.message) }
  }

  if (state === 'verifying') {
    return (
      <AuthCard title="Verifying your email">
        <p className="text-sm text-navy/70" role="status">One moment while we confirm your address...</p>
      </AuthCard>
    )
  }

  if (state === 'done') {
    return (
      <AuthCard title="Email verified">
        <div className="space-y-4">
          {result.pending_approval ? (
            <p className="auth-notice" role="status">{result.message}</p>
          ) : (
            <p className="text-sm text-navy/70" role="status">Thanks for confirming your address. Sign in to start using your VN Group account.</p>
          )}
          <Link to="/login" className="ui-btn ui-btn--primary w-full">Sign in</Link>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Link not valid">
      <form onSubmit={resend} className="space-y-4">
        <Err msg={err} />
        {info && <p className="auth-notice" role="status">{info}</p>}
        <p className="text-sm text-navy/70">Links work once and for 24 hours. Enter your email and we&apos;ll send a new one.</p>
        <Input type="email" required autoComplete="email" placeholder="Your email address" aria-label="Your email address" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Btn className="w-full">Send a new link</Btn>
      </form>
      <Link to="/login" className="mt-6 block text-center text-sm text-navy/70 underline">Back to sign in</Link>
    </AuthCard>
  )
}
