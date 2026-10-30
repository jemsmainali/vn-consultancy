import { useEffect, useState } from 'react'
import { useAuth } from '../auth'
import { fetchMyPhoto, updateProfile, uploadProfilePhoto } from '../api'
import { Card, Input, Select, Btn, Err, Icon, PageHeader, StatusBadge, initials } from '../ui'

const ROLE_LABEL = {
  student: 'Student', principal: 'Principal', parent: 'Parent/Guardian',
  other: 'Other', consultancy_staff: 'VN Group Staff',
}

const GENDERS = ['Male', 'Female', 'Other']
const COURSE_LEVELS = ["Bachelor's", "Master's", 'PhD', 'Diploma', 'Language Course', 'Other']

function Item({ label, editing, children, value, locked = false, span = false }) {
  return (
    <div className={`profile-item${locked ? ' profile-item--locked' : ''}${span ? ' profile-span' : ''}`}>
      <dt>{label}</dt>
      <dd>
        {editing && !locked ? children : <>
          {locked && <Icon name="lock" />}
          {value || <span className="text-navy/40">—</span>}
        </>}
      </dd>
    </div>
  )
}

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

  const showStudy = user.role === 'student' || user.target_course_level || user.target_field || user.target_country
  const avatar = preview || photoUrl

  return (
    <div className="mx-auto max-w-4xl ui-stack">
      <PageHeader
        eyebrow="Account"
        title="My profile"
        description="Keep your details up to date so the VN Group team can prepare your applications accurately."
        actions={!editing && <Btn type="button" onClick={() => setEditing(true)}><Icon name="edit" />Edit profile</Btn>}
      />
      <Err msg={err} />

      <Card className="profile-hero">
        <div className="profile-hero-band" aria-hidden="true" />
        <div className="profile-hero-body">
          <div className="profile-avatar">
            {avatar ? <img src={avatar} alt={user.full_name} /> : <span aria-hidden="true">{initials(user.full_name)}</span>}
          </div>
          <div className="profile-identity">
            <h2 className="profile-name">{user.full_name}</h2>
            <div className="profile-meta">
              <StatusBadge tone="gold">{ROLE_LABEL[user.role]}</StatusBadge>
              <span>{user.email}</span>
              <span>Member since {new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          {editing && (
            <label className="ui-btn ui-btn--secondary profile-photo-btn">
              <input type="file" accept="image/jpeg,image/png" onChange={onPhoto} className="sr-only" />
              <Icon name="upload" />{avatar ? 'Change photo' : 'Add photo'}
            </label>
          )}
        </div>
      </Card>

      <Card>
        <div className="ui-section-head">
          <div>
            <h2 className="ui-section-title">Personal information</h2>
            <p className="ui-section-text">Fields with a lock icon can only be changed by VN Group staff.</p>
          </div>
        </div>
        <dl className="profile-grid">
          <Item label="Full name" editing={editing} value={user.full_name}>
            <Input aria-label="Full name" value={f.full_name} onChange={set('full_name')} />
          </Item>
          <Item label="Email" locked value={user.email} />
          <Item label="National ID" locked value={user.national_id} />
          <Item label="Date of birth" locked value={user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : ''} />
          <Item label="Gender" editing={editing} value={user.gender}>
            <Select aria-label="Gender" value={f.gender} onChange={set('gender')}>
              <option value="">Not specified</option>
              {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
          </Item>
          <Item label="Citizenship / Nationality" editing={editing} value={user.citizenship}>
            <Input aria-label="Citizenship / Nationality" value={f.citizenship} onChange={set('citizenship')} />
          </Item>
          <Item label="Passport number" editing={editing} value={user.passport_number}>
            <Input aria-label="Passport number" value={f.passport_number} onChange={set('passport_number')} />
          </Item>
          <Item label="Member since" locked value={new Date(user.created_at).toLocaleDateString()} />
        </dl>
      </Card>

      {showStudy && (
        <Card>
          <div className="ui-section-head">
            <div>
              <h2 className="ui-section-title">Study plans</h2>
              <p className="ui-section-text">Helps your counsellor shortlist courses and destinations.</p>
            </div>
          </div>
          <dl className="profile-grid">
            <Item label="Intended course level" editing={editing} value={user.target_course_level}>
              <Select aria-label="Intended course level" value={f.target_course_level} onChange={set('target_course_level')}>
                <option value="">Not decided yet</option>
                {COURSE_LEVELS.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Item>
            <Item label="Field of study" editing={editing} value={user.target_field}>
              <Input aria-label="Field of study" value={f.target_field} onChange={set('target_field')} />
            </Item>
            <Item label="Target country" editing={editing} value={user.target_country} span>
              <Input aria-label="Target country" value={f.target_country} onChange={set('target_country')} />
            </Item>
          </dl>
        </Card>
      )}

      <Card>
        <div className="ui-section-head">
          <div>
            <h2 className="ui-section-title">Parent / guardian details</h2>
            <p className="ui-section-text">A contact we can reach about your application.</p>
          </div>
        </div>
        <dl className="profile-grid">
          <Item label="Name" editing={editing} value={user.parent_name}>
            <Input aria-label="Parent or guardian name" value={f.parent_name} onChange={set('parent_name')} />
          </Item>
          <Item label="Phone" editing={editing} value={user.parent_phone}>
            <Input aria-label="Parent or guardian phone" value={f.parent_phone} onChange={set('parent_phone')} />
          </Item>
          <Item label="Email" editing={editing} value={user.parent_email} span>
            <Input aria-label="Parent or guardian email" type="email" value={f.parent_email} onChange={set('parent_email')} />
          </Item>
        </dl>
      </Card>

      {editing && (
        <div className="profile-actions">
          <p>You&apos;re editing your profile.</p>
          <div>
            <Btn type="button" variant="secondary" onClick={cancel} disabled={busy}>Cancel</Btn>
            <Btn type="button" onClick={save} disabled={busy}>
              {busy ? <><span className="ui-spin" aria-hidden="true" />Saving…</> : <><Icon name="check" />Save changes</>}
            </Btn>
          </div>
        </div>
      )}
    </div>
  )
}
