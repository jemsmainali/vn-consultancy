import { useEffect, useState } from 'react'
import { useAuth } from '../auth'
import { fetchMyPhoto, updateProfile, uploadProfilePhoto } from '../api'
import { Card, Input, Select, Btn, Err } from '../ui'

const ROLE_LABEL = {
  student: 'Student', principal: 'Principal', parent: 'Parent/Guardian',
  other: 'Other', consultancy_staff: 'VN Group Staff',
}

const GENDERS = ['Male', 'Female', 'Other']
const COURSE_LEVELS = ["Bachelor's", "Master's", 'PhD', 'Diploma', 'Language Course', 'Other']

export default function Profile() {
  const { user, refresh } = useAuth()
  const [photoUrl, setPhotoUrl] = useState(null)
  const [editing, setEditing] = useState(false)
  const [f, setF] = useState({
    full_name: '', gender: '', citizenship: '', passport_number: '',
    target_course_level: '', target_field: '', target_country: '',
    parent_name: '', parent_phone: '', parent_email: '',
  })
  const [newPhoto, setNewPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { fetchMyPhoto().then(setPhotoUrl) }, [])
  useEffect(() => {
    if (user) {
      setF({
        full_name: user.full_name || '',
        gender: user.gender || '',
        citizenship: user.citizenship || '',
        passport_number: user.passport_number || '',
        target_course_level: user.target_course_level || '',
        target_field: user.target_field || '',
        target_country: user.target_country || '',
        parent_name: user.parent_name || '',
        parent_phone: user.parent_phone || '',
        parent_email: user.parent_email || '',
      })
    }
  }, [user])

  if (!user) return null
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const onPhoto = (e) => {
    const file = e.target.files?.[0]
    setErr('')
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) { setErr('Photo must be JPEG or PNG.'); return }
    if (file.size > 10 * 1024 * 1024) { setErr('Photo must be under 10MB.'); return }
    setNewPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  const save = async () => {
    setBusy(true); setErr('')
    try {
      await updateProfile({
        full_name: f.full_name,
        gender: f.gender || null,
        citizenship: f.citizenship || null,
        passport_number: f.passport_number || null,
        target_course_level: f.target_course_level || null,
        target_field: f.target_field || null,
        target_country: f.target_country || null,
        parent_name: f.parent_name || null,
        parent_phone: f.parent_phone || null,
        parent_email: f.parent_email || null,
      })
      if (newPhoto) await uploadProfilePhoto(newPhoto)
      await refresh()
      if (newPhoto) setPhotoUrl(await fetchMyPhoto())
      setNewPhoto(null); setPreview(null); setEditing(false)
    } catch (x) { setErr(x.message) }
    setBusy(false)
  }

  const cancel = () => {
    setF({
      full_name: user.full_name || '', gender: user.gender || '',
      citizenship: user.citizenship || '', passport_number: user.passport_number || '',
      target_course_level: user.target_course_level || '', target_field: user.target_field || '',
      target_country: user.target_country || '', parent_name: user.parent_name || '',
      parent_phone: user.parent_phone || '', parent_email: user.parent_email || '',
    })
    setNewPhoto(null); setPreview(null); setErr(''); setEditing(false)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-sans text-3xl font-bold">My profile</h1>
      <Err msg={err} />

      <Card className="p-6">
        <div className="flex items-center gap-5">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border border-navy/15 bg-cream/60">
            {(preview || photoUrl)
              ? <img src={preview || photoUrl} alt={user.full_name} className="h-full w-full object-cover" />
              : <div className="grid h-full w-full place-items-center text-xs text-navy/40">No photo</div>}
          </div>
          <div>
            <div className="font-sans text-xl font-bold text-navy">{user.full_name}</div>
            <div className="text-sm text-navy/60">{ROLE_LABEL[user.role]}</div>
            {editing && (
              <label className="mt-2 inline-block cursor-pointer text-sm font-medium text-navy underline">
                Change photo
                <input type="file" accept="image/jpeg,image/png" onChange={onPhoto} className="hidden" />
              </label>
            )}
          </div>
        </div>
      </Card>

      <Card className="space-y-6 p-6">
        <div>
          <h2 className="mb-3 border-b border-navy/10 pb-2 text-sm font-semibold uppercase tracking-wide text-navy/70">
            Personal information
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-navy/70">Full name</label>
              {editing ? <Input value={f.full_name} onChange={set('full_name')} /> : <p className="text-sm">{user.full_name}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy/70">Email</label>
              <p className="text-sm text-navy/60">{user.email} <span className="text-xs">(cannot be changed here)</span></p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy/70">National ID</label>
              <p className="text-sm text-navy/60">{user.national_id || '—'}</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy/70">Date of birth</label>
              <p className="text-sm text-navy/60">
                {user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : '—'}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy/70">Gender</label>
              {editing
                ? <Select value={f.gender} onChange={set('gender')}>
                    <option value="">Not specified</option>
                    {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </Select>
                : <p className="text-sm">{user.gender || '—'}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy/70">Citizenship / Nationality</label>
              {editing ? <Input value={f.citizenship} onChange={set('citizenship')} /> : <p className="text-sm">{user.citizenship || '—'}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy/70">Passport number</label>
              {editing ? <Input value={f.passport_number} onChange={set('passport_number')} /> : <p className="text-sm">{user.passport_number || '—'}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy/70">Member since</label>
              <p className="text-sm text-navy/60">{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {(user.role === 'student' || user.target_course_level || user.target_field || user.target_country) && (
          <div className="border-t border-navy/10 pt-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy/70">Study plans</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-navy/70">Intended course level</label>
                {editing
                  ? <Select value={f.target_course_level} onChange={set('target_course_level')}>
                      <option value="">Not decided yet</option>
                      {COURSE_LEVELS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </Select>
                  : <p className="text-sm">{user.target_course_level || '—'}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-navy/70">Field of study</label>
                {editing ? <Input value={f.target_field} onChange={set('target_field')} /> : <p className="text-sm">{user.target_field || '—'}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-navy/70">Target country</label>
                {editing ? <Input value={f.target_country} onChange={set('target_country')} /> : <p className="text-sm">{user.target_country || '—'}</p>}
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-navy/10 pt-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy/70">Parent / guardian details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-navy/70">Name</label>
              {editing ? <Input value={f.parent_name} onChange={set('parent_name')} /> : <p className="text-sm">{user.parent_name || '—'}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy/70">Phone</label>
              {editing ? <Input value={f.parent_phone} onChange={set('parent_phone')} /> : <p className="text-sm">{user.parent_phone || '—'}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-navy/70">Email</label>
              {editing ? <Input type="email" value={f.parent_email} onChange={set('parent_email')} /> : <p className="text-sm">{user.parent_email || '—'}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-navy/10 pt-4">
          {editing ? (
            <>
              <button onClick={cancel} disabled={busy} className="rounded-lg border border-navy/20 px-4 py-2 text-sm hover:bg-navy/5 disabled:opacity-50">
                Cancel
              </button>
              <Btn onClick={save} disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</Btn>
            </>
          ) : (
            <Btn onClick={() => setEditing(true)}>Edit profile</Btn>
          )}
        </div>
      </Card>
    </div>
  )
}