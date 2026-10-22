import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, openDocument, uploadWithProgress } from '../api'
import { useAuth } from '../auth'
import { Card, Input, Select, Btn, Err } from '../ui'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ListSkeleton from '../components/ui/ListSkeleton'

const BADGE = {
  pending: 'bg-amber-100 text-amber-800',
  under_review: 'bg-sky-100 text-sky-800',
  reviewed: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-700',
}
const label = (s) => s.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())
const roleLabel = { student: 'Student', principal: 'Principal', parent: 'Parent/Guardian', other: 'Other', consultancy_staff: 'Staff' }

export default function Documents() {
  const { user } = useAuth()
  const staff = user.role === 'consultancy_staff'
  const [docs, setDocs] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploadProgress, setUploadProgress] = useState(null) // null = not uploading; 0-100 while uploading
  const [busyId, setBusyId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const replaceInputRef = useRef(null)
  const replaceTargetId = useRef(null)

  const load = (p = page) => {
    setLoading(true)
    return api(`${staff ? '/documents' : '/documents/mine'}?page=${p}`)
      .then((res) => {
        setDocs(res.items)
        setTotal(res.total)
        setPageSize(res.page_size)
        setPage(res.page)
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(1) }, [])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return
    load(p)
  }

  const upload = async (e) => {
    e.preventDefault(); setBusy(true); setErr(''); setUploadProgress(0)
    const form = new FormData(e.target)
    const formEl = e.target
    try {
      await uploadWithProgress('/documents/upload', form, (pct) => setUploadProgress(pct))
      formEl.reset()
      await load(1)
    } catch (x) {
      setErr(x.message)
    }
    setBusy(false)
    setUploadProgress(null)
  }
  const setStatus = (id, status) =>
    api(`/documents/${id}/status`, { method: 'PATCH', json: { status } }).then(() => load()).catch((e) => setErr(e.message))

  const triggerReplace = (id) => {
    replaceTargetId.current = id
    if (replaceInputRef.current) {
      replaceInputRef.current.value = ''
      replaceInputRef.current.click()
    }
  }

  const onReplaceFileChosen = async (e) => {
    const file = e.target.files?.[0]
    const id = replaceTargetId.current
    if (!file || !id) return
    setBusyId(id); setErr('')
    try {
      const form = new FormData()
      form.append('file', file)
      await uploadWithProgress(`/documents/${id}/replace`, form, null)
      await load()
    } catch (x) { setErr(x.message) }
    setBusyId(null)
  }

  const remove = async (id) => {
    setBusyId(id); setErr('')
    try {
      await api(`/documents/${id}`, { method: 'DELETE' })
      // if this was the last item on the page, step back a page instead of showing an empty one
      const nextPage = docs.length === 1 && page > 1 ? page - 1 : page
      await load(nextPage)
    } catch (x) { setErr(x.message) }
    setBusyId(null)
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog open={confirmId !== null} title="Delete this document?" message="This cannot be undone." confirmLabel="Delete document" danger onCancel={() => setConfirmId(null)} onConfirm={async () => { await remove(confirmId); setConfirmId(null) }} />
      <h1 className="font-sans text-3xl font-bold">{staff ? 'Submitted documents' : 'My documents'}</h1>
      <Err msg={err} />
      {loading && <ListSkeleton label="Loading documents" />}

      {/* Hidden file input shared by every "Replace" button - triggerReplace() points it at the right document first */}
      <input
        ref={replaceInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={onReplaceFileChosen}
        className="hidden"
      />

      {!staff && (
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Send a document to VN Group</h2>
          <form onSubmit={upload} className="grid gap-3 sm:grid-cols-2">
            <Select name="doc_type" required defaultValue="">
              <option value="" disabled>Document type</option>
              {['Transcript', 'Certificate', 'Recommendation letter', 'Passport', 'Other'].map((t) => <option key={t}>{t}</option>)}
            </Select>
            <Input name="college_name" required placeholder="College name" />
            <Input name="university_name" required placeholder="University name" />
            <input name="file" type="file" required accept=".pdf,.jpg,.jpeg,.png" className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-cream-deep file:px-3 file:py-2 file:text-navy" />
            <Btn className="sm:col-span-2 sm:w-fit" disabled={busy}>{busy ? 'Uploading...' : 'Upload document'}</Btn>

            {uploadProgress !== null && (
              <div className="sm:col-span-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-cream-deep">
                  <div
                    className="h-full bg-navy transition-all duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-navy/60">
                  {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : 'Processing on the server...'}
                </p>
              </div>
            )}
          </form>
          <p className="mt-2 text-xs text-navy/60">PDF, JPG or PNG, up to 10 MB.</p>
        </Card>
      )}

      <Card className={`overflow-x-auto${loading ? ' opacity-60' : ''}`} aria-busy={loading}>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-navy/10 bg-cream-deep/60">
            <tr>
              {['Document', ...(staff ? ['Sent by'] : []), 'College and university', 'Uploaded', 'Status', ''].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {docs.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-navy/60">
                {staff ? 'No documents have been submitted yet.' : 'Nothing uploaded yet. Use the form above to send your first document.'}
              </td></tr>
            )}
            {docs.map((d) => (
              <tr key={d.id} className="border-b border-navy/5 last:border-0">
                <td className="px-4 py-3"><div className="font-medium">{d.doc_type}</div><div className="text-xs text-navy/60">{d.original_filename}</div></td>
                {staff && (
                  <td className="px-4 py-3">
                    {d.owner_name}
                    <div className="text-xs text-navy/60">{roleLabel[d.owner_role]}</div>
                  </td>
                )}
                <td className="px-4 py-3">{d.college_name}<div className="text-xs text-navy/60">{d.university_name}</div></td>
                <td className="px-4 py-3">{new Date(d.uploaded_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {staff ? (
                    <Select value={d.status} onChange={(e) => setStatus(d.id, e.target.value)}>
                      {Object.keys(BADGE).map((s) => <option key={s} value={s}>{label(s)}</option>)}
                    </Select>
                  ) : <span className={'rounded-full px-2.5 py-1 text-xs font-medium ' + BADGE[d.status]}>{label(d.status)}</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button onClick={() => openDocument(d.id).catch((e) => setErr(e.message))} className="font-medium underline">
                    View file
                  </button>
                  {staff && (
                    <Link to={`/messages?to=${d.owner_id}`} className="ml-4 font-medium underline">Message sender</Link>
                  )}
                  {!staff && d.status === 'pending' && (
                    <>
                      <button
                        onClick={() => triggerReplace(d.id)}
                        disabled={busyId === d.id}
                        className="ml-4 font-medium underline disabled:opacity-50"
                      >
                        Replace
                      </button>
                      <button
                        onClick={() => setConfirmId(d.id)}
                        disabled={busyId === d.id}
                        className="ml-4 font-medium text-red-700 underline disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </>
                  )}
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
