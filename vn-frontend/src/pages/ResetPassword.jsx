import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { AuthCard, Input, Btn, Err } from '../ui'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const [email, setEmail] = useState(params.get('email') || '')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault(); setErr('')
    if (newPassword !== confirmPassword) { setErr('Passwords do not match.'); return }
    setBusy(true)
    try {
      await api('/auth/reset-password', { method: 'POST', json: { email, code, new_password: newPassword } })
      setDone(true)
    } catch (x) { setErr(x.message) }
    setBusy(false)
  }

  if (done) {
    return (
      <AuthCard title="Password reset">
        <p className="rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
          Your password has been reset. You can now sign in with your new password.
        </p>
        <Link to="/login" className="mt-4 block text-center font-semibold text-navy underline">Back to sign in</Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Reset your password">
      <form onSubmit={submit} className="space-y-4">
        <Err msg={err} />
        <Input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input
          required inputMode="numeric" pattern="\d{6}" maxLength={6} placeholder="6-digit code"
          value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        />
        <Input type="password" required minLength={8} placeholder="New password (8+ characters)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <Input type="password" required minLength={8} placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        <Btn className="w-full" disabled={busy || code.length !== 6}>{busy ? 'Resetting...' : 'Reset password'}</Btn>
      </form>
      <p className="mt-4 text-center text-sm text-navy/70">
        <Link to="/forgot-password" className="font-semibold text-navy underline">Request a new code</Link>
      </p>
    </AuthCard>
  )
}