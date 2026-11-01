import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import { AuthCard, Input, Btn, Err } from '../ui'

export default function Verify() {
  const { refresh } = useAuth()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState(params.get('email') || '')
  const [code, setCode] = useState('')
  const [err, setErr] = useState(params.get('mailerr') ? "Your account was created, but we couldn't send the verification email. Use \"Resend code\" below." : '')
  const [info, setInfo] = useState('')
  const [pending, setPending] = useState(false)
  const [busy, setBusy] = useState(false)
  const [wait, setWait] = useState(params.get('sent') ? 60 : 0)

  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait(wait - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr(''); setInfo('')
    try {
      const res = await api('/auth/verify-email', { method: 'POST', json: { email, code } })
      if (res.pending_approval) {
        setPending(true)
        setInfo(res.message)
      } else {
        await refresh()
        nav('/')
      }
    } catch (x) { setErr(x.message) }
    setBusy(false)
  }

  const resend = async () => {
    setErr(''); setInfo('')
    try {
      await api('/auth/resend-otp', { method: 'POST', json: { email } })
      setInfo('A new code is on its way. Check your inbox and spam folder.')
      setWait(60)
    } catch (x) { setErr(x.message) }
  }

  if (pending) {
    return (
      <AuthCard title="Almost there">
        <p className="rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-800">{info}</p>
        <Link to="/login" className="mt-4 block text-center font-semibold text-navy underline">Back to sign in</Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Check your email">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-navy/70">
          {params.get('mailerr') ? 'Request a 6-digit code for' : 'We sent a 6-digit code to'} <span className="font-semibold text-navy">{email || 'your email'}</span>. It expires in 10 minutes. Check your spam folder if it hasn't arrived.
        </p>
        <Err msg={err} />
        {info && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{info}</p>}
        {!params.get('email') && <Input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />}
        <Input
          required inputMode="numeric" pattern="\d{6}" maxLength={6} placeholder="000000"
          value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        />
        <Btn className="w-full" disabled={busy || code.length !== 6}>{busy ? 'Verifying...' : 'Verify email'}</Btn>
      </form>
      <div className="mt-4 flex items-center justify-between text-sm">
        <button onClick={resend} disabled={wait > 0 || !email} className="font-semibold underline disabled:no-underline disabled:opacity-50">
          {wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}
        </button>
        <Link to="/login" className="text-navy/70 underline">Back to sign in</Link>
      </div>
    </AuthCard>
  )
}