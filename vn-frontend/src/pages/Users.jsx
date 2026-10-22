import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, Err } from '../ui'

const ROLE_LABEL = {
  student: 'Student',
  principal: 'Principal',
  parent: 'Parent/Guardian',
  other: 'Other',
  consultancy_staff: 'Staff',
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [err, setErr] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = (p = page) =>
    api(`/auth/users?page=${p}`)
      .then((res) => {
        setUsers(res.items)
        setTotal(res.total)
        setPageSize(res.page_size)
        setPage(res.page)
      })
      .catch((e) => setErr(e.message))

  useEffect(() => { load(1) }, [])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const goToPage = (p) => { if (p >= 1 && p <= totalPages) load(p) }

  const toggle = async (u) => {
    const action = u.is_active ? 'deactivate' : 'reactivate'
    if (u.is_active && !window.confirm(`Deactivate ${u.full_name}? They won't be able to sign in until reactivated.`)) return
    setBusyId(u.id); setErr('')
    try {
      await api(`/auth/${u.id}/${action}`, { method: 'POST' })
      await load()
    } catch (x) { setErr(x.message) }
    setBusyId(null)
  }

  return (
    <div className="space-y-6">
      <h1 className="font-sans text-3xl font-bold">Manage users</h1>
      <Err msg={err} />

      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-navy/10 bg-cream-deep/60">
            <tr>
              {['Name', 'Email', 'Role', 'Status', 'Joined', ''].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-navy/60">No users found.</td></tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-b border-navy/5 last:border-0">
                <td className="px-4 py-3 font-medium">{u.full_name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{ROLE_LABEL[u.role] || u.role}</td>
                <td className="px-4 py-3">
                  <span className={'rounded-full px-2.5 py-1 text-xs font-medium ' + (u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700')}>
                    {u.is_active ? 'Active' : 'Deactivated'}
                  </span>
                </td>
                <td className="px-4 py-3">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button
                    onClick={() => toggle(u)}
                    disabled={busyId === u.id}
                    className={'font-medium underline disabled:opacity-50 ' + (u.is_active ? 'text-red-700' : 'text-emerald-700')}
                  >
                    {u.is_active ? 'Deactivate' : 'Reactivate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {total > 0 && (
          <div className="flex items-center justify-between border-t border-navy/10 px-4 py-3 text-sm">
            <span className="text-navy/60">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="rounded-lg border border-navy/20 px-3 py-1.5 font-medium hover:bg-navy/5 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Previous
              </button>
              <span className="text-navy/70">Page {page} of {totalPages}</span>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="rounded-lg border border-navy/20 px-3 py-1.5 font-medium hover:bg-navy/5 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}