import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Logo, Card, Input, Select, Btn, Err } from '../ui'

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'principal', label: 'College/University Principal' },
  { value: 'parent', label: 'Parent / Guardian' },
  { value: 'other', label: 'Other' },
  { value: 'consultancy_staff', label: 'VN Group Staff' },
]

const GENDERS = ['Male', 'Female', 'Other']

const COURSE_LEVELS = ["Bachelor's", "Master's", 'PhD', 'Diploma', 'Language Course', 'Other']

const MAX_PHOTO_MB = 10 // keep in sync with backend MAX_UPLOAD_MB
const NID_PATTERN = /^\d{10}$/ // must match app/schemas/user.py's NID_PATTERN exactly

const SectionTitle = ({ children }) => (
  <h2 className="mb-4 border-b border-navy/10 pb-2 font-sans text-sm font-semibold uppercase tracking-wide text-navy/70">
    {children}
  </h2>
)

const Field = ({ label, children, span, hint }) => (
  <div className={span ? 'sm:col-span-2' : ''}>
    <label className="mb-1 block text-xs font-medium text-navy/70">{label}</label>
    {children}
    {hint && <p className="mt-1 text-xs text-navy/50">{hint}</p>}
  </div>
)

export default function Register() {
  const nav = useNavigate()
  const [f, setF] = useState({
    full_name: '', email: '', password: '', role: 'student', invite_code: '',
    national_id: '', date_of_birth: '', gender: '', citizenship: '', passport_number: '',
    target_course_level: '', target_field: '', target_country: '',
    parent_name: '', parent_phone: '', parent_email: '',
  })
  const [showParent, setShowParent] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const setNationalId = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10)
    setF({ ...f, national_id: digitsOnly })
  }

  const onPhoto = (e) => {
    const file = e.target.files?.[0]
    setErr('')
    if (!file) { setPhoto(null); setPreview(null); return }
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setErr('Profile photo must be a JPEG or PNG image.'); e.target.value = ''; return
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      setErr(`Profile photo must be under ${MAX_PHOTO_MB}MB.`); e.target.value = ''; return
    }
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  const submit = async (e) => {
    e.preventDefault(); setErr('')
    if (!agreed) { setErr('Please accept the Terms and Conditions to continue.'); return }
    if (!photo) { setErr('Please upload a profile photo.'); return }
    if (!NID_PATTERN.test(f.national_id)) {
      setErr('National ID must be exactly 10 digits — the number on your National ID Card.')
      return
    }
    setBusy(true)
    try {
      const formData = new FormData()
      formData.append('full_name', f.full_name)
      formData.append('email', f.email)
      formData.append('password', f.password)
      formData.append('role', f.role)
      formData.append('national_id', f.national_id)
      formData.append('date_of_birth', f.date_of_birth)
      formData.append('gender', f.gender)
      formData.append('citizenship', f.citizenship)
      formData.append('terms_accepted', 'true')
      if (f.passport_number) formData.append('passport_number', f.passport_number)
      if (f.role === 'student') {
        if (f.target_course_level) formData.append('target_course_level', f.target_course_level)
        if (f.target_field) formData.append('target_field', f.target_field)
        if (f.target_country) formData.append('target_country', f.target_country)
      }
      if (f.role === 'principal' || f.role === 'consultancy_staff') formData.append('invite_code', f.invite_code)
      if (showParent) {
        if (f.parent_name) formData.append('parent_name', f.parent_name)
        if (f.parent_phone) formData.append('parent_phone', f.parent_phone)
        if (f.parent_email) formData.append('parent_email', f.parent_email)
      }
      formData.append('photo', photo)

      await api('/auth/register', { method: 'POST', body: formData })
      nav('/verify?sent=1&email=' + encodeURIComponent(f.email))
    } catch (x) { setErr(x.message) }
    setBusy(false)
  }

  const needsInvite = f.role === 'principal' || f.role === 'consultancy_staff'

  return (
    <div className="min-h-screen bg-cream px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex justify-center"><Logo /></div>

        <Card className="p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="font-sans text-2xl font-bold text-navy">Create your account</h1>
            <p className="mt-1 text-sm text-navy/60">Join VN Group to become an member!!</p>
          </div>

          <form onSubmit={submit} className="space-y-8">
            <Err msg={err} />

            {/* Photo + account type */}
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border border-navy/15 bg-cream/60">
                {preview
                  ? <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                  : <div className="grid h-full w-full place-items-center text-xs text-navy/40">No photo</div>}
              </div>
              <div className="w-full flex-1 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-navy/70">Profile photo (JPEG or PNG, required)</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    required
                    onChange={onPhoto}
                    className="block w-full text-sm text-navy/80 file:mr-3 file:rounded-lg file:border-0 file:bg-navy file:px-3 file:py-2 file:text-sm file:font-medium file:text-cream hover:file:bg-navy-700"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-navy/70">I am registering as</label>
                  <Select value={f.role} onChange={set('role')}>
                    {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </Select>
                </div>
              </div>
            </div>

            {/* Personal information */}
            <div>
              <SectionTitle>Personal information</SectionTitle>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Full name" span>
                  <Input required value={f.full_name} onChange={set('full_name')} />
                </Field>
                <Field label="Email address">
                  <Input type="email" required value={f.email} onChange={set('email')} />
                </Field>
                <Field label="Password (8+ characters)">
                  <Input type="password" required minLength={8} value={f.password} onChange={set('password')} />
                </Field>
                <Field label="Date of birth">
                  <Input type="date" required value={f.date_of_birth} onChange={set('date_of_birth')} />
                </Field>
                <Field label="Gender">
                  <Select required value={f.gender} onChange={set('gender')}>
                    <option value="" disabled>Select gender</option>
                    {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </Select>
                </Field>
                <Field label="Citizenship / Nationality">
                  <Input required placeholder="e.g. Nepali" value={f.citizenship} onChange={set('citizenship')} />
                </Field>
                <Field
                  label="National ID Card number"
                  hint="The 10-digit number on your National ID Card (not the old citizenship certificate number)."
                >
                  <Input
                    required
                    value={f.national_id}
                    onChange={setNationalId}
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="e.g. 1234567890"
                  />
                </Field>
                <Field label="Passport number (optional)">
                  <Input value={f.passport_number} onChange={set('passport_number')} />
                </Field>
                {needsInvite && (
                  <Field label="Invite code from VN Group" span>
                    <Input required value={f.invite_code} onChange={set('invite_code')} />
                  </Field>
                )}
              </div>
            </div>

            {/* Study plans - students only */}
            {f.role === 'student' && (
              <div>
                <SectionTitle>Study plans (optional)</SectionTitle>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Intended course level">
                    <Select value={f.target_course_level} onChange={set('target_course_level')}>
                      <option value="">Not decided yet</option>
                      {COURSE_LEVELS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </Select>
                  </Field>
                  <Field label="Field of study">
                    <Input placeholder="e.g. Computer Science" value={f.target_field} onChange={set('target_field')} />
                  </Field>
                  <Field label="Target country" span>
                    <Input placeholder="e.g. Australia" value={f.target_country} onChange={set('target_country')} />
                  </Field>
                </div>
              </div>
            )}

            {/* Parent / guardian */}
            <div>
              <button
                type="button"
                onClick={() => setShowParent((s) => !s)}
                className="flex w-full items-center justify-between border-b border-navy/10 pb-2 text-left font-sans text-sm font-semibold uppercase tracking-wide text-navy/70"
              >
                Parent / guardian details (optional)
                <span className="text-navy/50">{showParent ? '−' : '+'}</span>
              </button>
              {showParent && (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Name">
                    <Input value={f.parent_name} onChange={set('parent_name')} />
                  </Field>
                  <Field label="Phone">
                    <Input value={f.parent_phone} onChange={set('parent_phone')} />
                  </Field>
                  <Field label="Email" span>
                    <Input type="email" value={f.parent_email} onChange={set('parent_email')} />
                  </Field>
                </div>
              )}
            </div>

            <label className="flex items-start gap-2 text-sm text-navy/80">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-navy/30 text-navy focus:ring-navy"
              />
              <span>
                I agree to VN Group's{' '}
                <Link to="/terms" target="_blank" className="font-semibold underline">Terms and Conditions</Link>{' '}
                and consent to my information being used to process my application.
              </span>
            </label>

            <Btn className="w-full" disabled={busy}>{busy ? 'Creating account...' : 'Create account'}</Btn>
          </form>

          <p className="mt-6 text-center text-sm text-navy/70">
            Already registered? <Link to="/login" className="font-semibold text-navy underline">Sign in</Link>
          </p>
        </Card>
      </div>
    </div>
  )
}