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
const ROLES_REQUIRING_BANK_DETAILS = new Set(ROLES.filter((role) => role.value !== 'student').map((role) => role.value))
const REQUIRE_BANK_DETAILS = import.meta.env.VITE_REQUIRE_BANK_DETAILS === 'true'
const BANK_ACCOUNT_NUMBER_MIN_LENGTH = 8
const BANK_ACCOUNT_NUMBER_MAX_LENGTH = 24

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
    bank_name: '', bank_account_number: '',
  })
  const [showParent, setShowParent] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [bankFieldErrors, setBankFieldErrors] = useState({})
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const bankDetailsVisible = REQUIRE_BANK_DETAILS && ROLES_REQUIRING_BANK_DETAILS.has(f.role)

  const setBankField = (key) => (e) => {
    setF((value) => ({ ...value, [key]: e.target.value }))
    setBankFieldErrors((errors) => ({ ...errors, [key]: '' }))
  }

  const changeRole = (e) => {
    setF((value) => ({ ...value, role: e.target.value, bank_name: '', bank_account_number: '' }))
    setBankFieldErrors({})
  }

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
    if (bankDetailsVisible) {
      const name = f.bank_name.trim()
      const accountNumber = f.bank_account_number.replace(/[ -]/g, '')
      const nextErrors = {}
      if (!name) nextErrors.bank_name = 'Enter the bank name.'
      else if (name.length < 2 || name.length > 100) nextErrors.bank_name = 'Bank name must be 2 to 100 characters.'
      else if (!/^[\p{L}\p{N} .&()\-]+$/u.test(name)) nextErrors.bank_name = 'Use letters, numbers, spaces, periods, ampersands, hyphens, and parentheses only.'
      if (!f.bank_account_number.trim()) nextErrors.bank_account_number = 'Enter the bank account number.'
      else if (!/^[0-9]+$/.test(accountNumber)) nextErrors.bank_account_number = 'Enter digits only; spaces and hyphens are allowed while typing.'
      else if (accountNumber.length < BANK_ACCOUNT_NUMBER_MIN_LENGTH || accountNumber.length > BANK_ACCOUNT_NUMBER_MAX_LENGTH) {
        nextErrors.bank_account_number = `Bank account number must be ${BANK_ACCOUNT_NUMBER_MIN_LENGTH} to ${BANK_ACCOUNT_NUMBER_MAX_LENGTH} digits.`
      }
      setBankFieldErrors(nextErrors)
      if (Object.keys(nextErrors).length) return
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
      if (bankDetailsVisible) {
        formData.append('bank_name', f.bank_name.trim())
        formData.append('bank_account_number', f.bank_account_number.replace(/[ -]/g, ''))
      }
      if (showParent) {
        if (f.parent_name) formData.append('parent_name', f.parent_name)
        if (f.parent_phone) formData.append('parent_phone', f.parent_phone)
        if (f.parent_email) formData.append('parent_email', f.parent_email)
      }
      formData.append('photo', photo)

      await api('/auth/register', { method: 'POST', body: formData })
      setF((value) => ({ ...value, bank_name: '', bank_account_number: '' }))
      setBankFieldErrors({})
      nav('/verify?sent=1&email=' + encodeURIComponent(f.email))
    } catch (x) {
      setErr(x.message)
      if (x.fieldErrors) setBankFieldErrors((current) => ({ ...current, bank_name: x.fieldErrors.bank_name || '', bank_account_number: x.fieldErrors.bank_account_number || '' }))
    }
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
                  <Select value={f.role} onChange={changeRole}>
                    {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </Select>
                </div>
              </div>
              <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${bankDetailsVisible ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`} aria-hidden={!bankDetailsVisible}>
                <div className="min-h-0 overflow-hidden">
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Bank name" span>
                      <input type="text" required={bankDetailsVisible} disabled={!bankDetailsVisible} autoComplete="off" value={f.bank_name} onChange={setBankField('bank_name')} aria-invalid={Boolean(bankFieldErrors.bank_name)} aria-describedby={bankFieldErrors.bank_name ? 'bank-name-error' : undefined} className="h-12 w-full rounded-lg border border-navy/20 bg-cream/60 px-3 text-sm placeholder:text-navy/40 focus:border-navy focus:outline-none focus:ring-2 focus:ring-gold/60 disabled:pointer-events-none" />
                      {bankFieldErrors.bank_name && <p id="bank-name-error" className="mt-1 text-xs text-red-700">{bankFieldErrors.bank_name}</p>}
                    </Field>
                    <Field label="Bank account number" span>
                      <input type="text" inputMode="numeric" required={bankDetailsVisible} disabled={!bankDetailsVisible} autoComplete="off" value={f.bank_account_number} onChange={setBankField('bank_account_number')} aria-invalid={Boolean(bankFieldErrors.bank_account_number)} aria-describedby={bankFieldErrors.bank_account_number ? 'bank-account-error' : 'bank-details-help'} className="h-12 w-full rounded-lg border border-navy/20 bg-cream/60 px-3 text-sm placeholder:text-navy/40 focus:border-navy focus:outline-none focus:ring-2 focus:ring-gold/60 disabled:pointer-events-none" />
                      {bankFieldErrors.bank_account_number && <p id="bank-account-error" className="mt-1 text-xs text-red-700">{bankFieldErrors.bank_account_number}</p>}
                    </Field>
                    <p id="bank-details-help" className="flex items-center gap-1.5 text-xs text-navy/60 sm:col-span-2"><svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="8.5" width="12" height="8" rx="1.5"/><path d="M6.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5M10 11.5v2"/></svg>Your bank details are stored encrypted and are never shown in full.</p>
                  </div>
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
