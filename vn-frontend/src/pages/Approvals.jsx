import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, Btn, Err } from '../ui'

const ROLE = { principal: 'Principal', consultancy_staff: 'Staff' }

export default function Approvals() {
  const [people, setPeople] = useState([])
  const [err, setErr] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = () => api('/auth/pending').then(setPeople).catch((e) => setErr(e.message))
  useEffect(() => { load() }, [])

  const act = async (id, action) => {
    setBusyId(id); setErr('')
    try { await api(`/auth/${id}/${action}`, { method: 'POST' }); await load() }
    catch (x) { setErr(x.message) }
    setBusyId(null)
  }

  return (
    <div className="space-y-6">
      <h1 className="font-sans text-3xl font-bold">Pending approvals</h1>
      <Err msg={err} />
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-navy/10 bg-cream-deep/60">
            <tr>{['Name', 'Email', 'Role', 'Registered', ''].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {people.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-navy/60">No accounts are waiting for approval.</td></tr>
            )}
            {people.map((p) => (
              <tr key={p.id} className="border-b border-navy/5 last:border-0">
                <td className="px-4 py-3 font-medium">{p.full_name}</td>
                <td className="px-4 py-3">{p.email}</td>
                <td className="px-4 py-3">{ROLE[p.role]}</td>
                <td className="px-4 py-3">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <Btn disabled={busyId === p.id} onClick={() => act(p.id, 'approve')}>Approve</Btn>
                  <button
                    disabled={busyId === p.id}
                    onClick={() => act(p.id, 'reject')}
                    className="ml-3 font-medium text-red-700 underline disabled:opacity-50"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}