import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, Btn, Err, Icon, PageHeader, StatusBadge, EmptyState, Avatar } from '../ui'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ListSkeleton from '../components/ui/ListSkeleton'

const ROLE = { principal: 'Principal', consultancy_staff: 'Staff' }

export default function Approvals() {
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)

  const load = () => api('/auth/pending').then(setPeople).catch((e) => setErr(e.message)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const act = async (id, action) => {
    setBusyId(id); setErr('')
    try { await api(`/auth/${id}/${action}`, { method: 'POST' }); await load() }
    catch (x) { setErr(x.message) }
    setBusyId(null)
  }

  return (
    <div className="ui-stack">
      <ConfirmDialog open={Boolean(rejectTarget)} title="Reject this account?" message="This account will be disabled and will not be able to sign in." confirmLabel="Reject account" danger onCancel={() => setRejectTarget(null)} onConfirm={async () => { await act(rejectTarget.id, 'reject'); setRejectTarget(null) }} />
      <PageHeader
        eyebrow="Staff tools"
        title="Pending approvals"
        description="Principal and staff accounts need a VN Group team member to approve them before they can sign in."
        actions={!loading && <span className="ui-count"><strong>{people.length}</strong> waiting</span>}
      />
      <Err msg={err} />

      {loading ? <ListSkeleton label="Loading pending accounts" /> : (
        <Card className="overflow-hidden">
          {people.length === 0 ? (
            <EmptyState icon="approve" title="You're all caught up">No accounts are waiting for approval.</EmptyState>
          ) : (
            <div className="ui-table-wrap">
              <table className="ui-table ui-table--stack">
                <thead>
                  <tr>{['Name', 'Email', 'Role', 'Registered'].map((h) => <th key={h}>{h}</th>)}<th><span className="sr-only">Actions</span></th></tr>
                </thead>
                <tbody>
                  {people.map((p, i) => (
                    <tr key={p.id} style={{ '--i': i }}>
                      <td className="ui-cell-lead" data-label="Name">
                        <span className="ui-cell-person"><Avatar name={p.full_name} size="sm" /><span className="ui-cell-primary">{p.full_name}</span></span>
                      </td>
                      <td data-label="Email">{p.email}</td>
                      <td data-label="Role"><StatusBadge tone="indigo">{ROLE[p.role]}</StatusBadge></td>
                      <td data-label="Registered" className="whitespace-nowrap">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="ui-cell-actions">
                        <Btn type="button" variant="success" size="sm" disabled={busyId === p.id} onClick={() => act(p.id, 'approve')}>
                          {busyId === p.id ? <span className="ui-spin" aria-hidden="true" /> : <Icon name="check" />}Approve
                        </Btn>
                        <Btn type="button" variant="danger" size="sm" disabled={busyId === p.id} onClick={() => setRejectTarget(p)}>Reject</Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
