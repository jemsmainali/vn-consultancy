import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, openDocument, uploadWithProgress } from '../api'
import { useAuth } from '../auth'
import { Card, Input, Select, Btn, Err, Field, Icon, PageHeader, StatusBadge, EmptyState, Pagination, Avatar } from '../ui'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ListSkeleton from '../components/ui/ListSkeleton'

const STATUS_TONE = {
  pending: 'gold',
  under_review: 'info',
  reviewed: 'success',
  rejected: 'danger',
}
const label = (s) => s.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())
const roleLabel = { student: 'Student', principal: 'Principal', parent: 'Parent/Guardian', other: 'Other', consultancy_staff: 'Staff' }
const DOC_TYPES = ['Transcript', 'Certificate', 'Recommendation letter', 'Passport', 'Other']

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
  const [fileName, setFileName] = useState('')
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
      setFileName('')
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

  const firstLoad = loading && docs.length === 0

  return (
    <div className="ui-stack">
      <ConfirmDialog open={confirmId !== null} title="Delete this document?" message="This cannot be undone." confirmLabel="Delete document" danger onCancel={() => setConfirmId(null)} onConfirm={async () => { await remove(confirmId); setConfirmId(null) }} />
      <PageHeader
        eyebrow={staff ? 'Staff workspace' : 'Your workspace'}
        title={staff ? 'Submitted documents' : 'My documents'}
        description={staff
          ? 'Review files sent by students, principals and families, update their status and follow up with the sender.'
          : 'Send your academic documents to VN Group securely and follow their review status here.'}
        actions={total > 0 && <span className="ui-count"><strong>{total}</strong> document{total === 1 ? '' : 's'}</span>}
      />
      <Err msg={err} />

      {/* Hidden file input shared by every "Replace" button - triggerReplace() points it at the right document first */}
      <input
        ref={replaceInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={onReplaceFileChosen}
        className="hidden"
      />

      {!staff && (
        <Card>
          <div className="ui-section-head">
            <div>
              <h2 className="ui-section-title">Send a document to VN Group</h2>
              <p className="ui-section-text">PDF, JPG or PNG, up to 10 MB. You can replace or delete a file while it&apos;s still pending.</p>
            </div>
          </div>
          <form onSubmit={upload} className="doc-upload-grid">
            <Field label="Document type">
              <Select name="doc_type" required defaultValue="">
                <option value="" disabled>Select a type</option>
                {DOC_TYPES.map((t) => <option key={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="College name">
              <Input name="college_name" required placeholder="e.g. Trichandra College" />
            </Field>
            <Field label="University name">
              <Input name="university_name" required placeholder="e.g. Tribhuvan University" />
            </Field>
            <label className={`doc-dropzone doc-span${fileName ? ' has-file' : ''}`}>
              <input name="file" type="file" required accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(e) => setFileName(e.target.files?.[0]?.name || '')} />
              <span className="doc-dropzone-icon"><Icon name={fileName ? 'documents' : 'upload'} /></span>
              <span className="doc-dropzone-text">
                <span className="doc-dropzone-title">{fileName || 'Choose a file to upload'}</span>
                <span className="doc-dropzone-hint">{fileName ? 'Click to choose a different file' : 'PDF, JPG or PNG · max 10 MB'}</span>
              </span>
            </label>

            {uploadProgress !== null && (
              <div className="doc-span" role="status">
                <div className="doc-progress"><span style={{ width: `${uploadProgress}%` }} /></div>
                <p className="mt-2 text-sm text-navy/70">
                  {uploadProgress < 100 ? `Uploading… ${uploadProgress}%` : 'Processing on the server…'}
                </p>
              </div>
            )}
            <div className="doc-upload-footer doc-span">
              <span className="flex items-center gap-2 text-sm text-navy/70"><Icon name="lock" className="!h-4 !w-4" />Files are stored privately and only visible to VN Group staff.</span>
              <Btn disabled={busy}>
                {busy ? <><span className="ui-spin" aria-hidden="true" />Uploading…</> : <><Icon name="upload" />Upload document</>}
              </Btn>
            </div>
          </form>
        </Card>
      )}

      {firstLoad ? <ListSkeleton label="Loading documents" /> : (
        <Card className={`overflow-hidden transition-opacity${loading ? ' opacity-60' : ''}`} aria-busy={loading}>
          {docs.length === 0 ? (
            <EmptyState icon="documents" title={staff ? 'No documents yet' : 'Nothing uploaded yet'}>
              {staff ? 'No documents have been submitted yet.' : 'Use the form above to send your first document.'}
            </EmptyState>
          ) : (
            <div className="ui-table-wrap">
              <table className="ui-table ui-table--stack">
                <thead>
                  <tr>
                    {['Document', ...(staff ? ['Sent by'] : []), 'College and university', 'Uploaded', 'Status'].map((h) => <th key={h}>{h}</th>)}
                    <th><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((d, i) => (
                    <tr key={d.id} style={{ '--i': i }}>
                      <td className="ui-cell-lead" data-label="Document">
                        <span className="ui-cell-file">
                          <span className="ui-file-icon"><Icon name="documents" /></span>
                          <span className="min-w-0">
                            <span className="ui-cell-primary">{d.doc_type}</span>
                            <span className="ui-cell-secondary ui-truncate" title={d.original_filename}>{d.original_filename}</span>
                          </span>
                        </span>
                      </td>
                      {staff && (
                        <td data-label="Sent by">
                          <span className="ui-cell-person">
                            <Avatar name={d.owner_name} size="sm" />
                            <span className="text-left">
                              <span className="ui-cell-primary">{d.owner_name}</span>
                              <span className="ui-cell-secondary">{roleLabel[d.owner_role]}</span>
                            </span>
                          </span>
                        </td>
                      )}
                      <td data-label="College">
                        <span>
                          {d.college_name}
                          <span className="ui-cell-secondary">{d.university_name}</span>
                        </span>
                      </td>
                      <td data-label="Uploaded" className="whitespace-nowrap">{new Date(d.uploaded_at).toLocaleDateString()}</td>
                      <td data-label="Status">
                        {staff ? (
                          <Select aria-label={`Status for ${d.doc_type} from ${d.owner_name}`} className={`ui-status-select is-${d.status}`} value={d.status} onChange={(e) => setStatus(d.id, e.target.value)}>
                            {Object.keys(STATUS_TONE).map((s) => <option key={s} value={s}>{label(s)}</option>)}
                          </Select>
                        ) : <StatusBadge tone={STATUS_TONE[d.status]}>{label(d.status)}</StatusBadge>}
                      </td>
                      <td className="ui-cell-actions">
                        <Btn type="button" variant="secondary" size="sm" onClick={() => openDocument(d.id).catch((e) => setErr(e.message))}>
                          <Icon name="eye" />View
                        </Btn>
                        {staff && (
                          <Link to={`/messages?to=${d.owner_id}`} className="ui-btn ui-btn--ghost ui-btn--sm"><Icon name="messages" />Message</Link>
                        )}
                        {!staff && d.status === 'pending' && (
                          <>
                            <Btn type="button" variant="secondary" size="sm" onClick={() => triggerReplace(d.id)} disabled={busyId === d.id}>
                              <Icon name="refresh" />Replace
                            </Btn>
                            <Btn type="button" variant="danger" size="sm" onClick={() => setConfirmId(d.id)} disabled={busyId === d.id}>
                              <Icon name="trash" />Delete
                            </Btn>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {total > 0 && <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPage={goToPage} disabled={loading} />}
        </Card>
      )}
    </div>
  )
}
