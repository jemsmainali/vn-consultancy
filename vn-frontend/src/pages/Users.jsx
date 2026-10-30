import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, Btn, Err, PageHeader, StatusBadge, EmptyState, Pagination, Avatar } from '../ui'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ListSkeleton from '../components/ui/ListSkeleton'

const ROLE_LABEL = {
  student: 'Student',
  principal: 'Principal',
  parent: 'Parent/Guardian',
  other: 'Other',
  consultancy_staff: 'Staff',
}
const ROLE_TONE = { consultancy_staff: 'gold', principal: 'indigo', student: 'info' }

export default function Users() {
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [deactivateTarget, setDeactivateTarget] = useState(null)

  const load = (p = page) =>
    api(`/auth/users?page=${p}`)
      .then((res) => {
        setUsers(res.items)
        setTotal(res.total)
        setPageSize(res.page_size)
        setPage(res.page)
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false))

  useEffect(() => { load(1) }, [])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const goToPage = (p) => { if (p >= 1 && p <= totalPages) load(p) }

  const run = async (u) => {
    const action = u.is_active ? 'deactivate' : 'reactivate'
    setBusyId(u.id); setErr('')
    try {
      await api(`/auth/${u.id}/${action}`, { method: 'POST' })
      await load()
    } catch (x) { setErr(x.message) }
    setBusyId(null)
  }

  // Deactivating asks for confirmation first; reactivating is immediate.
  const toggle = (u) => (u.is_active ? setDeactivateTarget(u) : run(u))

  return (
    <div className="ui-stack">
      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        title={`Deactivate ${deactivateTarget?.full_name || 'this user'}?`}
        message="They won't be able to sign in until reactivated."
        confirmLabel="Deactivate"
        danger
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={async () => { await run(deactivateTarget); setDeactivateTarget(null) }}
      />
      <PageHeader
        eyebrow="Staff tools"
        title="Manage users"
        description="Everyone with a VN Group account. Deactivated users can't sign in until they're reactivated."
        actions={total > 0 && <span className="ui-count"><strong>{total}</strong> user{total === 1 ? '' : 's'}</span>}
      />
      <Err msg={err} />

      {loading ? <ListSkeleton label="Loading users" /> : (
        <Card className="overflow-hidden">
          {users.length === 0 ? <EmptyState icon="users" title="No users found" /> : (
            <div className="ui-table-wrap">
              <table className="ui-table ui-table--stack">
                <thead>
                  <tr>{['Name', 'Email', 'Role', 'Status', 'Joined'].map((h) => <th key={h}>{h}</th>)}<th><span className="sr-only">Actions</span></th></tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id} style={{ '--i': i }} className={u.is_active ? '' : 'opacity-70'}>
                      <td className="ui-cell-lead" data-label="Name">
                        <span className="ui-cell-person"><Avatar name={u.full_name} size="sm" /><span className="ui-cell-primary">{u.full_name}</span></span>
                      </td>
                      <td data-label="Email"><span className="ui-truncate" title={u.email}>{u.email}</span></td>
                      <td data-label="Role"><StatusBadge tone={ROLE_TONE[u.role] || 'neutral'}>{ROLE_LABEL[u.role] || u.role}</StatusBadge></td>
                      <td data-label="Status"><StatusBadge tone={u.is_active ? 'success' : 'danger'}>{u.is_active ? 'Active' : 'Deactivated'}</StatusBadge></td>
                      <td data-label="Joined" className="whitespace-nowrap">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="ui-cell-actions">
                        <Btn type="button" size="sm" variant={u.is_active ? 'danger' : 'secondary'} onClick={() => toggle(u)} disabled={busyId === u.id}>
                          {busyId === u.id && <span className="ui-spin" aria-hidden="true" />}
                          {u.is_active ? 'Deactivate' : 'Reactivate'}
                        </Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {total > 0 && <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPage={goToPage} />}
        </Card>
      )}
    </div>
  )
}
