import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { AuthCard, Btn, ROLE_LABEL } from '../ui'

// The only page a verified principal or agent sees until VN Group staff approve the account.
// The API enforces the same rule: every other private endpoint answers 403 while status is "pending".
export default function Pending() {
  const { user, loading, refresh, logout } = useAuth()
  const nav = useNavigate()
  const [checking, setChecking] = useState(false)
  const [checked, setChecked] = useState(false)

  if (loading) return <p className="p-8">Loading...</p>
  if (!user) return <Navigate to="/login" replace />
  if (user.status !== 'pending') return <Navigate to="/portal" replace />

  const checkAgain = async () => {
    setChecking(true)
    await refresh()
    setChecking(false)
    setChecked(true)
  }

  return (
    <AuthCard title="Awaiting approval">
      <div className="space-y-4">
        <p className="text-sm text-navy/70">
          Thanks, <span className="font-semibold text-navy">{user.full_name}</span>. Your email is verified and your{' '}
          {ROLE_LABEL[user.role] || 'account'} account is now with VN Group staff for review.
        </p>
        <p className="auth-notice">
          You&apos;ll get an email at <span className="font-semibold">{user.email}</span> once it&apos;s approved.
          Until then, the rest of the portal stays locked.
        </p>
        {checked && <p className="text-sm text-navy/70" role="status">Still waiting for approval.</p>}
        <Btn type="button" className="w-full" onClick={checkAgain} disabled={checking}>
          {checking ? 'Checking...' : 'Check again'}
        </Btn>
        <Btn type="button" variant="secondary" className="w-full" onClick={async () => { await logout(); nav('/login') }}>
          Sign out
        </Btn>
      </div>
      <Link to="/" className="mt-6 block text-center text-sm text-navy/70 underline">Back to website</Link>
    </AuthCard>
  )
}
