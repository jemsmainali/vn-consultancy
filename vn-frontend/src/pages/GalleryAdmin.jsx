import { useCallback, useEffect, useRef, useState } from 'react'
import { API_BASE, api } from '../api'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ListSkeleton from '../components/ui/ListSkeleton'

const categories = [
  ['student-life', 'Student life'], ['counselling', 'Counselling'], ['events', 'Events'],
  ['workshops', 'Workshops'], ['team', 'Team'], ['campus', 'Campus'],
]

export default function GalleryAdmin() {
  const [items, setItems] = useState([])
  const [drafts, setDrafts] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [removeTarget, setRemoveTarget] = useState(null)
  const [form, setForm] = useState({ caption: '', alt_text: '', category: 'student-life', position: '0', published: false, publication_authorized: false })
  const [file, setFile] = useState(null)
  const fileInput = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const rows = await api('/gallery/staff')
      setItems(rows)
      setDrafts(Object.fromEntries(rows.map((item) => [item.id, {
        caption: item.caption, alt_text: item.alt_text, category: item.category,
        position: item.position, published: item.published, publication_authorized: item.publication_authorized,
      }])))
    } catch (err) { setError(err.message || 'Gallery records could not be loaded.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const submit = async (event) => {
    event.preventDefault()
    setError(''); setNotice('')
    if (!file) { setError('Choose a supported image file to upload.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('The image must be 10 MB or smaller.'); return }
    if (form.published && !form.publication_authorized) { setError('Confirm image rights and permission before publishing.'); return }
    setSaving(true)
    const payload = new FormData()
    Object.entries(form).forEach(([key, value]) => payload.append(key, String(value)))
    payload.append('file', file)
    try {
      await api('/gallery', { method: 'POST', body: payload })
      setNotice('Gallery image uploaded. Review its caption and publication status below.')
      setForm({ caption: '', alt_text: '', category: 'student-life', position: '0', published: false, publication_authorized: false })
      setFile(null)
      if (fileInput.current) fileInput.current.value = ''
      await load()
    } catch (err) { setError(err.message || 'The image could not be uploaded.') }
    finally { setSaving(false) }
  }

  const updateDraft = (id, field, value) => setDrafts((current) => ({ ...current, [id]: { ...current[id], [field]: value } }))
  const saveItem = async (id) => {
    setError(''); setNotice('')
    const draft = drafts[id]
    try {
      await api(`/gallery/${id}`, { method: 'PATCH', json: { ...draft, position: Number(draft.position) } })
      setNotice('Gallery item updated.')
      await load()
    } catch (err) { setError(err.message || 'The gallery item could not be updated.') }
  }
  const removeItem = async (item) => {
    setError(''); setNotice('')
    try {
      await api(`/gallery/${item.id}`, { method: 'DELETE' })
      setNotice('Gallery item removed.')
      await load()
    } catch (err) { setError(err.message || 'The gallery item could not be removed.') }
  }

  return <div className="gallery-admin">
    <ConfirmDialog open={Boolean(removeTarget)} title="Remove this gallery image?" message={`${removeTarget?.caption || ''} will be removed along with its stored image.`} confirmLabel="Remove image" danger onCancel={() => setRemoveTarget(null)} onConfirm={async () => { await removeItem(removeTarget); setRemoveTarget(null) }} />
    <header className="gallery-admin-heading"><div><p className="gallery-admin-eyebrow">Website content</p><h1>Gallery management</h1><p>Upload and manage images shown in the public homepage gallery. Only VN Group staff can access these controls.</p></div><button type="button" className="gallery-admin-refresh" onClick={load} disabled={loading}>Refresh list</button></header>
    <p className="gallery-admin-caution">Publish only images VN Group owns or has permission to use. Confirm consent before publishing identifiable students. Do not upload passports, application documents, personal contact information, or private student records.</p>
    {error && <p className="gallery-admin-error" role="alert">{error}</p>}
    {notice && <p className="gallery-admin-success" role="status">{notice}</p>}
    <section className="gallery-admin-upload"><h2>Add a gallery photo</h2><p>JPEG, PNG, WebP, or AVIF; the server verifies the actual file type. New uploads are private until published.</p>
      <form onSubmit={submit}>
        <label>Caption<input required maxLength="180" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} /></label>
        <label>Alternative text<input required minLength="5" maxLength="240" value={form.alt_text} onChange={(e) => setForm({ ...form, alt_text: e.target.value })} /></label>
        <label>Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Display order<input type="number" min="0" max="10000" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></label>
        <label className="gallery-admin-check"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Publish immediately</label>
        <label className="gallery-admin-check"><input type="checkbox" checked={form.publication_authorized} onChange={(e) => setForm({ ...form, publication_authorized: e.target.checked })} /> I confirm image rights and publication consent</label>
        <label className="gallery-admin-file">Image file<input ref={fileInput} required type="file" accept="image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif" onChange={(e) => setFile(e.target.files?.[0] || null)} /><small>JPEG, PNG, WebP, or AVIF. Maximum 10 MB. Images are stored on the application server.</small></label>
        <button type="submit" disabled={saving}>{saving ? 'Uploading…' : 'Upload photo'}</button>
      </form>
    </section>
    <section className="gallery-admin-list"><div className="gallery-admin-list-head"><h2>Gallery items</h2><span>{items.length} item{items.length === 1 ? '' : 's'}</span></div>
      {loading && <ListSkeleton label="Loading gallery items" />}
      {!loading && !items.length && <p className="gallery-admin-empty">No staff gallery uploads yet. The public homepage currently uses labeled illustrative placeholders.</p>}
      <div className="gallery-admin-items">{items.map((item) => {
        const draft = drafts[item.id] || item
        return <article className="gallery-admin-item" key={item.id}>
          <img src={`${API_BASE}${item.image_url}`} alt="" width="240" height="160" />
          <div className="gallery-admin-edit">
            <label>Caption<input maxLength="180" value={draft.caption} onChange={(e) => updateDraft(item.id, 'caption', e.target.value)} /></label>
            <label>Alternative text<input maxLength="240" value={draft.alt_text} onChange={(e) => updateDraft(item.id, 'alt_text', e.target.value)} /></label>
            <div className="gallery-admin-edit-row"><label>Category<select value={draft.category} onChange={(e) => updateDraft(item.id, 'category', e.target.value)}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Order<input type="number" min="0" max="10000" value={draft.position} onChange={(e) => updateDraft(item.id, 'position', e.target.value)} /></label></div>
            <label className="gallery-admin-check"><input type="checkbox" checked={Boolean(draft.published)} onChange={(e) => updateDraft(item.id, 'published', e.target.checked)} /> Published on website</label>
            <label className="gallery-admin-check"><input type="checkbox" checked={Boolean(draft.publication_authorized)} onChange={(e) => updateDraft(item.id, 'publication_authorized', e.target.checked)} /> Image rights and consent confirmed</label>
            <div className="gallery-admin-item-actions"><button type="button" onClick={() => saveItem(item.id)}>Save changes</button><button type="button" className="gallery-admin-danger" onClick={() => setRemoveTarget(item)}>Delete</button></div>
          </div>
        </article>
      })}</div>
    </section>
  </div>
}
