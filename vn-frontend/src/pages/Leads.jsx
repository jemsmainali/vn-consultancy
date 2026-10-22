import { Fragment, useCallback, useEffect, useState } from 'react'
import { api } from '../api'

const STATUSES = [
  ['new', 'New'], ['contacted', 'Contacted'], ['counselling', 'Counselling'],
  ['documents_pending', 'Documents pending'], ['application_in_progress', 'Application in progress'],
  ['submitted', 'Submitted'], ['decision_received', 'Decision received'], ['closed', 'Closed'],
]

function toLocalInput(value) {
  if (!value) return ''
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
}

export default function Leads() {
  const [items, setItems] = useState([])
  const [staff, setStaff] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [filters, setFilters] = useState({ search: '', status: '', destination: '', assigned_to_id: '', created_after: '', created_before: '' })
  const [selected, setSelected] = useState(null)
  const [draft, setDraft] = useState(null)
  const pageSize = 20

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const query = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    const criteria = {}
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      if (key === 'created_after') criteria[key] = new Date(`${value}T00:00:00`).toISOString()
      else if (key === 'created_before') {
        const endExclusive = new Date(`${value}T00:00:00`)
        endExclusive.setDate(endExclusive.getDate() + 1)
        criteria[key] = endExclusive.toISOString()
      } else criteria[key] = value
    }
    try {
      const result = await api(`/enquiries/staff/search?${query.toString()}`, { method: 'POST', json: criteria })
      setItems(result.items)
      setTotal(result.total)
    } catch (e) {
      setError(e.message || 'Enquiries could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    const timer = setTimeout(load, 250)
    return () => clearTimeout(timer)
  }, [load])
  useEffect(() => { api('/auth/staff').then(setStaff).catch(() => {}) }, [])

  const startReview = (item) => {
    setSelected(item.id)
    setDraft({
      status: item.status,
      assigned_to_id: item.assigned_to_id || '',
      follow_up_at: toLocalInput(item.follow_up_at),
      internal_notes: item.internal_notes || '',
    })
  }

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      ...draft,
      assigned_to_id: draft.assigned_to_id || null,
      follow_up_at: draft.follow_up_at ? new Date(draft.follow_up_at).toISOString() : null,
    }
    try {
      await api(`/enquiries/staff/${selected}`, { method: 'PATCH', json: payload })
      setSelected(null)
      setDraft(null)
      await load()
    } catch (e) {
      setError(e.message || 'Your changes could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  return <section className="leads-page">
    <div className="leads-heading"><div><p className="eyebrow">Staff workspace</p><h1>Student enquiries</h1><p>Review, assign, and track follow-up for website enquiries.</p></div><span className="lead-total">{total} total</span></div>
    <form className="lead-filters" onSubmit={(event) => { event.preventDefault(); setPage(1); load() }}>
      <label>Search<input value={filters.search} onChange={(e) => { setPage(1); setFilters({ ...filters, search: e.target.value }) }} placeholder="Name, email, or phone"/></label>
      <label>Status<select value={filters.status} onChange={(e) => { setPage(1); setFilters({ ...filters, status: e.target.value }) }}><option value="">All statuses</option>{STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Destination<input value={filters.destination} onChange={(e) => { setPage(1); setFilters({ ...filters, destination: e.target.value }) }} placeholder="Any destination"/></label>
      <label>Assigned to<select value={filters.assigned_to_id} onChange={(e) => { setPage(1); setFilters({ ...filters, assigned_to_id: e.target.value }) }}><option value="">Anyone</option>{staff.map((person) => <option key={person.id} value={person.id}>{person.full_name}</option>)}</select></label>
      <label>From<input type="date" value={filters.created_after} onChange={(e) => { setPage(1); setFilters({ ...filters, created_after: e.target.value }) }}/></label>
      <label>To<input type="date" value={filters.created_before} onChange={(e) => { setPage(1); setFilters({ ...filters, created_before: e.target.value }) }}/></label>
    </form>
    {error && <p className="lead-error" role="alert">{error}</p>}
    <div className="leads-table-wrap"><table className="leads-table"><thead><tr><th>Enquiry</th><th>Study interest</th><th>Status</th><th>Assigned</th><th>Follow-up</th><th></th></tr></thead><tbody>
      {!loading && items.length === 0 && <tr><td colSpan="6" className="leads-empty">{error ? 'Enquiries are unavailable.' : 'No enquiries match these filters.'}</td></tr>}
      {items.map((item) => <Fragment key={item.id}>
        <tr key={item.id}>
          <td><strong>{item.full_name}</strong><small>{item.reference} · {formatDate(item.created_at)}</small><a href={`mailto:${item.email}`}>{item.email}</a><a href={`tel:${item.phone}`}>{item.phone}</a></td>
          <td><strong>{item.preferred_destination || 'Not specified'}</strong><small>{[item.education_level, item.study_field, item.intended_intake].filter(Boolean).join(' · ') || 'No study details'}</small></td>
          <td><span className={`lead-status status-${item.status}`}>{STATUSES.find(([value]) => value === item.status)?.[1] || item.status}</span></td>
          <td>{staff.find((person) => person.id === item.assigned_to_id)?.full_name || 'Unassigned'}</td>
          <td>{formatDate(item.follow_up_at)}</td>
          <td><button type="button" className="lead-review-button" onClick={() => selected === item.id ? setSelected(null) : startReview(item)}>{selected === item.id ? 'Close' : 'Review'}</button></td>
        </tr>
        {selected === item.id && draft && <tr key={`${item.id}-details`}><td colSpan="6"><div className="lead-detail"><div className="lead-message"><h2>Student message</h2><p>{item.message || 'No message was added.'}</p><small>Consent recorded {formatDate(item.consented_at)}</small></div><form className="lead-edit-form" onSubmit={save}>
          <label>Status<select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>{STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Assigned counsellor<select value={draft.assigned_to_id} onChange={(e) => setDraft({ ...draft, assigned_to_id: e.target.value })}><option value="">Unassigned</option>{staff.map((person) => <option key={person.id} value={person.id}>{person.full_name}</option>)}</select></label>
          <label>Follow-up date and time<input type="datetime-local" value={draft.follow_up_at} onChange={(e) => setDraft({ ...draft, follow_up_at: e.target.value })}/></label>
          <label className="notes-field">Internal notes<textarea rows="3" maxLength="10000" value={draft.internal_notes} onChange={(e) => setDraft({ ...draft, internal_notes: e.target.value })}/></label>
          <button className="lead-review-button save-lead" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save updates'}</button>
        </form></div></td></tr>}
      </Fragment>)}
      {loading && <tr><td colSpan="6" className="leads-empty">Loading enquiries…</td></tr>}
    </tbody></table></div>
    <div className="lead-pagination"><span>Page {page} of {Math.max(1, Math.ceil(total / pageSize))}</span><div><button type="button" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>Previous</button><button type="button" disabled={page * pageSize >= total || loading} onClick={() => setPage(page + 1)}>Next</button></div></div>
  </section>
}
