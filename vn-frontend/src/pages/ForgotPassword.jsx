import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { AuthCard, Input, Btn, Err } from '../ui'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [err, setErr] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      await api('/auth/forgot-password', { method: 'POST', json: { email } })
      setSent(true)
    } catch (x) { setErr(x.message) }
    setBusy(false)
  }

  if (sent) {
    return (
      <AuthCard title="Check your email">
        <p className="rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
          If an account exists for <span className="font-semibold">{email}</span>, we've sent a code to reset your password.
        </p>
        <Link to={`/reset-password?email=${encodeURIComponent(email)}`} className="mt-4 block text-center font-semibold text-navy underline">
          Enter the code
        </Link>
        <Link to="/login" className="mt-2 block text-center text-sm text-navy/70 underline">Back to sign in</Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Forgot your password?">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-navy/70">Enter your email and we'll send you a code to reset your password.</p>
        <Err msg={err} />
        <Input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Btn className="w-full" disabled={busy}>{busy ? 'Sending...' : 'Send reset code'}</Btn>
      </form>
      <p className="mt-4 text-center text-sm text-navy/70">
        Remembered it? <Link to="/login" className="font-semibold text-navy underline">Sign in</Link>
      </p>
    </AuthCard>
  )
}