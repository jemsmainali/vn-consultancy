import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Err } from '../ui'
import PasswordInput from '../components/ui/PasswordInput'
import AuthLayout, { AuthAside } from '../components/auth/AuthLayout'
import AuthField from '../components/auth/AuthField'

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'principal', label: 'College/University Principal' },
  { value: 'parent', label: 'Parent / Guardian' },
  { value: 'other', label: 'Other' },
  { value: 'consultancy_staff', label: 'VN Group Staff' },
]
const ROLES_REQUIRING_BANK_DETAILS = new Set(['other']) // keep in sync with app/schemas/user.py
const BANK_FIELDS = ['bank_account_name', 'bank_name', 'bank_account_number', 'bank_nominee_name']
const EMPTY_BANK = { bank_account_name: '', bank_name: '', bank_account_number: '', bank_nominee_name: '' }
const BANK_PERSON_NAME = /^[\p{L}\p{N} .,'&()\-]+$/u
const BANK_ACCOUNT_NUMBER_MIN_LENGTH = 8
const BANK_ACCOUNT_NUMBER_MAX_LENGTH = 24

const GENDERS = ['Male', 'Female', 'Other']

const COURSE_LEVELS = ["Bachelor's", "Master's", 'PhD', 'Diploma', 'Language Course', 'Other']

const MAX_PHOTO_MB = 10 // keep in sync with backend MAX_UPLOAD_MB
const NID_PATTERN = /^\d{10}$/ // must match app/schemas/user.py's NID_PATTERN exactly

function Section({ title, description, children, ...props }) {
  return (
    <section className="auth-section" {...props}>
      <div className="auth-section-head">
        <h2 className="auth-section-title">{title}</h2>
        {description && <p className="auth-section-description">{description}</p>}
      </div>
      {children}
    </section>
  )
}

export default function Register() {
  const nav = useNavigate()
  const [f, setF] = useState({
    full_name: '', email: '', password: '', role: 'student', invite_code: '',
    national_id: '', date_of_birth: '', gender: '', citizenship: '', passport_number: '',
    target_course_level: '', target_field: '', target_country: '',
    parent_name: '', parent_phone: '', parent_email: '',
    ...EMPTY_BANK,
  })
  const [showParent, setShowParent] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [photoErr, setPhotoErr] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [bankFieldErrors, setBankFieldErrors] = useState({})
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const bankDetailsVisible = ROLES_REQUIRING_BANK_DETAILS.has(f.role)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Create an account | VN Group'
    return () => { document.title = previousTitle }
  }, [])

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const setBankField = (key) => (e) => {
    setF((value) => ({ ...value, [key]: e.target.value }))
    setBankFieldErrors((errors) => ({ ...errors, [key]: '' }))
  }

  const changeRole = (e) => {
    setF((value) => ({ ...value, role: e.target.value, ...EMPTY_BANK }))
    setBankFieldErrors({})
  }

  const setNationalId = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10)
    setF({ ...f, national_id: digitsOnly })
  }

  const onPhoto = (e) => {
    const file = e.target.files?.[0]
    setPhotoErr('')
    if (!file) { setPhoto(null); setPreview(null); return }
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setPhotoErr('Profile photo must be a JPEG or PNG image.'); e.target.value = ''; return
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      setPhotoErr(`Profile photo must be under ${MAX_PHOTO_MB}MB.`); e.target.value = ''; return
    }
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  const submit = async (e) => {
    e.preventDefault(); setErr('')
    if (!agreed) { setErr('Please accept the Terms and Conditions to continue.'); return }
    if (!photo) { setErr('Please upload a profile photo.'); return }
    if (f.national_id && !NID_PATTERN.test(f.national_id)) {
      setErr('National ID must be exactly 10 digits — the number on your National ID Card.')
      return
    }
    if (bankDetailsVisible) {
      const accountName = f.bank_account_name.trim().replace(/\s+/g, ' ')
      const nomineeName = f.bank_nominee_name.trim().replace(/\s+/g, ' ')
      const name = f.bank_name.trim()
      const accountNumber = f.bank_account_number.replace(/[ -]/g, '')
      const nextErrors = {}
      const personNameError = (value, label) => {
        if (!value) return `Enter the ${label.toLowerCase()}.`
        if (value.length < 2 || value.length > 100) return `${label} must be 2 to 100 characters.`
        if (!BANK_PERSON_NAME.test(value)) return 'Use letters, numbers, spaces, periods, commas, apostrophes, ampersands, hyphens, and parentheses only.'
        return ''
      }
      const accountNameError = personNameError(accountName, 'Account holder name')
      if (accountNameError) nextErrors.bank_account_name = accountNameError
      const nomineeNameError = personNameError(nomineeName, 'Nominee name')
      if (nomineeNameError) nextErrors.bank_nominee_name = nomineeNameError
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
      if (f.national_id) formData.append('national_id', f.national_id)
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
        formData.append('bank_account_name', f.bank_account_name.trim().replace(/\s+/g, ' '))
        formData.append('bank_name', f.bank_name.trim())
        formData.append('bank_account_number', f.bank_account_number.replace(/[ -]/g, ''))
        formData.append('bank_nominee_name', f.bank_nominee_name.trim().replace(/\s+/g, ' '))
      }
      if (showParent) {
        if (f.parent_name) formData.append('parent_name', f.parent_name)
        if (f.parent_phone) formData.append('parent_phone', f.parent_phone)
        if (f.parent_email) formData.append('parent_email', f.parent_email)
      }
      formData.append('photo', photo)

      await api('/auth/register', { method: 'POST', body: formData })
      setF((value) => ({ ...value, ...EMPTY_BANK }))
      setBankFieldErrors({})
      nav('/verify?sent=1&email=' + encodeURIComponent(f.email))
    } catch (x) {
      // 502: the account was created but the verification email could not be sent.
      if (x.status === 502) return nav('/verify?mailerr=1&email=' + encodeURIComponent(f.email))
      setErr(x.message)
      if (x.fieldErrors) setBankFieldErrors((current) => ({ ...current, ...Object.fromEntries(BANK_FIELDS.map((key) => [key, x.fieldErrors[key] || ''])) }))
    }
    setBusy(false)
  }

  const needsInvite = f.role === 'principal' || f.role === 'consultancy_staff'

  return (
    <AuthLayout
      variant="register"
      aside={(
        <AuthAside
          eyebrow="Create your VN Group account"
          title="Start your study abroad journey with a clear plan."
          description="One account for your documents, messages and application progress with VN Group."
          points={[
            'Fill in your profile and personal details',
            'Verify your email with a one-time code',
            'Share documents and talk with our team',
          ]}
        />
      )}
    >
      <div className="auth-heading">
        <p className="auth-kicker">Registration</p>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-intro">
          It takes about five minutes. All fields are required unless marked <span className="auth-optional auth-optional--inline">Optional</span>.
        </p>
      </div>

      <form onSubmit={submit} className="auth-form auth-register-form">
        <Section title="Profile" description="Your photo, account type and sign-in details.">
          <div className="auth-photo">
            <div className="auth-photo-preview">
              {preview
                ? <img src={preview} alt="Selected profile photo preview" />
                : <svg aria-hidden="true" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="24" cy="18" r="7.5" /><path strokeLinecap="round" d="M10 40c1.8-7 7.3-10.5 14-10.5S36.2 33 38 40" /></svg>}
            </div>
            <div className="auth-photo-body">
              <p className="auth-label" id="photo-label">Profile photo</p>
              <p className="auth-hint" id="photo-hint">A clear, front-facing photo. JPEG or PNG, up to {MAX_PHOTO_MB}MB.</p>
              <div className="auth-photo-actions">
                <label className="auth-upload-btn">
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    required
                    onChange={onPhoto}
                    className="sr-only"
                    aria-labelledby="photo-label photo-button-text"
                    aria-describedby={photoErr ? 'photo-error photo-hint' : 'photo-hint'}
                    aria-invalid={photoErr ? true : undefined}
                  />
                  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M10 13V4m0 0L6.5 7.5M10 4l3.5 3.5M4 13.5v1A1.5 1.5 0 0 0 5.5 16h9a1.5 1.5 0 0 0 1.5-1.5v-1" /></svg>
                  <span id="photo-button-text">{photo ? 'Change photo' : 'Upload photo'}</span>
                </label>
                {photo && <span className="auth-photo-name" title={photo.name}>{photo.name}</span>}
              </div>
              {photoErr && <p id="photo-error" className="auth-field-error" role="alert">{photoErr}</p>}
            </div>
          </div>

          <div className="auth-grid">
            <AuthField label="I am registering as" span={!needsInvite}>
              <select className="auth-input auth-select" value={f.role} onChange={changeRole}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </AuthField>
            {needsInvite && (
              <AuthField label="Invite code from VN Group">
                <input className="auth-input" required autoComplete="off" value={f.invite_code} onChange={set('invite_code')} />
              </AuthField>
            )}
            <AuthField label="Full name" span>
              <input className="auth-input" required autoComplete="name" placeholder="As shown on your passport or ID" value={f.full_name} onChange={set('full_name')} />
            </AuthField>
            <AuthField label="Email address">
              <input className="auth-input" type="email" required autoComplete="email" placeholder="you@example.com" value={f.email} onChange={set('email')} />
            </AuthField>
            <AuthField label="Password" hint="At least 8 characters.">
              <PasswordInput wrapperClassName="auth-password" className="auth-input" autoComplete="new-password" required minLength={8} value={f.password} onChange={set('password')} />
            </AuthField>
          </div>
        </Section>

        <Section title="Personal information" description="Used to verify your identity and prepare your applications.">
          <div className="auth-grid">
            <AuthField label="Date of birth">
              <input className="auth-input" type="date" required autoComplete="bday" value={f.date_of_birth} onChange={set('date_of_birth')} />
            </AuthField>
            <AuthField label="Gender">
              <select className="auth-input auth-select" required value={f.gender} onChange={set('gender')}>
                <option value="" disabled>Select gender</option>
                {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </AuthField>
            <AuthField label="Citizenship / Nationality">
              <input className="auth-input" required placeholder="e.g. Nepali" value={f.citizenship} onChange={set('citizenship')} />
            </AuthField>
            <AuthField label="Passport number" optional>
              <input className="auth-input" autoComplete="off" value={f.passport_number} onChange={set('passport_number')} />
            </AuthField>
            <AuthField
              label="National ID Card number"
              hint="The 10-digit number on your National ID Card (not the old citizenship certificate number)."
              optional
              span
            >
              <input
                className="auth-input"
                value={f.national_id}
                onChange={setNationalId}
                inputMode="numeric"
                maxLength={10}
                autoComplete="off"
                placeholder="e.g. 1234567890"
              />
            </AuthField>
          </div>
        </Section>

        {bankDetailsVisible && (
          <Section title="Bank details" description="Required for this account type.">
            <div className="auth-grid">
              <AuthField label="Account holder name" hint="Exactly as the bank shows it." error={bankFieldErrors.bank_account_name} span>
                <input className="auth-input" type="text" required autoComplete="off" maxLength={100} placeholder="e.g. Sita Sharma" value={f.bank_account_name} onChange={setBankField('bank_account_name')} />
              </AuthField>
              <AuthField label="Bank name" error={bankFieldErrors.bank_name} span>
                <input className="auth-input" type="text" required autoComplete="off" maxLength={100} placeholder="Full name of your bank" value={f.bank_name} onChange={setBankField('bank_name')} />
              </AuthField>
              <AuthField label="Bank account number" hint="8 to 24 digits." error={bankFieldErrors.bank_account_number} span>
                <input className="auth-input" type="text" inputMode="numeric" required autoComplete="off" placeholder="Digits only" value={f.bank_account_number} onChange={setBankField('bank_account_number')} />
              </AuthField>
              <AuthField label="Nominee name" hint="The nominee registered on this bank account." error={bankFieldErrors.bank_nominee_name} span>
                <input className="auth-input" type="text" required autoComplete="off" maxLength={100} placeholder="e.g. Hari Sharma" value={f.bank_nominee_name} onChange={setBankField('bank_nominee_name')} />
              </AuthField>
              <p className="auth-secure-note auth-field--span">
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="8.5" width="12" height="8" rx="1.5"/><path d="M6.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5M10 11.5v2"/></svg>
                Your bank details are stored encrypted and are never shown in full.
              </p>
            </div>
          </Section>
        )}

        {f.role === 'student' && (
          <Section title="Study preferences" description="Optional — helps your counsellor prepare before your first conversation.">
            <div className="auth-grid">
              <AuthField label="Intended course level" optional>
                <select className="auth-input auth-select" value={f.target_course_level} onChange={set('target_course_level')}>
                  <option value="">Not decided yet</option>
                  {COURSE_LEVELS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </AuthField>
              <AuthField label="Field of study" optional>
                <input className="auth-input" placeholder="e.g. Computer Science" value={f.target_field} onChange={set('target_field')} />
              </AuthField>
              <AuthField label="Target country" optional span>
                <input className="auth-input" placeholder="e.g. Australia" value={f.target_country} onChange={set('target_country')} />
              </AuthField>
            </div>
          </Section>
        )}

        <section className="auth-section auth-section--collapsible">
          <h2 className="auth-section-title">
            <button
              type="button"
              className="auth-collapse-toggle"
              aria-expanded={showParent}
              aria-controls="guardian-fields"
              onClick={() => setShowParent((s) => !s)}
            >
              <span className="auth-collapse-text">
                Parent / guardian details
                <span className="auth-optional">Optional</span>
              </span>
              <span className="auth-collapse-action">
                {showParent ? 'Remove' : 'Add details'}
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="m5.5 8 4.5 4.5L14.5 8" /></svg>
              </span>
            </button>
          </h2>
          <p className="auth-section-description">Add a contact we can reach about your application.</p>
          {/* Fields mount only while open so a hidden, invalid email can't block submit. */}
          <div id="guardian-fields" className="auth-grid auth-reveal" hidden={!showParent}>
            {showParent && <>
              <AuthField label="Name" optional>
                <input className="auth-input" autoComplete="off" value={f.parent_name} onChange={set('parent_name')} />
              </AuthField>
              <AuthField label="Phone" optional>
                <input className="auth-input" type="tel" autoComplete="off" value={f.parent_phone} onChange={set('parent_phone')} />
              </AuthField>
              <AuthField label="Email" optional span>
                <input className="auth-input" type="email" autoComplete="off" value={f.parent_email} onChange={set('parent_email')} />
              </AuthField>
            </>}
          </div>
        </section>

        <div className="auth-finish">
          <label className="auth-consent">
            <input
              type="checkbox"
              className="auth-checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>
              I agree to VN Group&apos;s{' '}
              <Link to="/terms" target="_blank" rel="noopener" className="auth-text-link auth-text-link--strong">
                Terms and Conditions<span className="sr-only"> (opens in a new tab)</span>
              </Link>{' '}
              and consent to my information being used to process my application.
            </span>
          </label>

          <Err msg={err} />

          <div className="auth-actions">
            <button type="submit" className="auth-submit" disabled={busy} aria-busy={busy}>
              {busy ? <><span className="auth-spinner" aria-hidden="true" />Creating account…</> : 'Create account'}
            </button>
            <p className="auth-switch auth-switch--inline">
              Already registered? <Link to="/login" className="auth-text-link auth-text-link--strong">Log in</Link>
            </p>
          </div>
        </div>
      </form>
    </AuthLayout>
  )
}
