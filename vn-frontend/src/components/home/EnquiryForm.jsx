import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { submitEnquiry } from '../../api/enquiry'
import { siteContent } from '../../data/siteContent'

// Mirrors the max lengths in app/schemas/enquiry.py (EnquiryCreate).
const LIMITS = { full_name: 150, phone: 32, study_field: 150, message: 2000 }

function createSubmissionKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  const bytes = new Uint8Array(16)
  globalThis.crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  return [...bytes].map((byte, index) => `${[4, 6, 8, 10].includes(index) ? '-' : ''}${byte.toString(16).padStart(2, '0')}`).join('')
}

function validNepaliMobile(value) {
  let digits = value.replace(/\D/g, '')
  if (digits.startsWith('977')) digits = digits.slice(3)
  if (digits.startsWith('0')) digits = digits.slice(1)
  return /^9[6-8]\d{8}$/.test(digits)
}

const emptyForm = (destination = '') => ({ full_name: '', phone: '', email: '', preferred_destination: destination, education_level: '', study_field: '', message: '', privacy_consent: false, website: '' })

export default function EnquiryForm() {
  const location = useLocation()
  const queryCountry = new URLSearchParams(location.search).get('country') || ''
  const { countries, studyLevels, notSureDestination } = siteContent.home.enquiry
  const destinations = [...countries, notSureDestination]
  const [form, setForm] = useState(() => emptyForm(countries.includes(queryCountry) ? queryCountry : ''))
  const [errors, setErrors] = useState({})
  const [failure, setFailure] = useState('')
  const [sending, setSending] = useState(false)
  const [receipt, setReceipt] = useState('')
  const [retryable, setRetryable] = useState(false)
  const submissionKeyRef = useRef(null)
  // Blocks a second submit (double click, Enter + click) before React re-renders the disabled button.
  const inFlightRef = useRef(false)

  useEffect(() => {
    if (!countries.includes(queryCountry)) return
    setForm((current) => current.preferred_destination === queryCountry
      ? current
      : { ...current, preferred_destination: queryCountry })
  }, [queryCountry, countries])

  const update = (event) => {
    const { name, value, checked, type } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setErrors((current) => {
      if (!current[name]) return current
      const { [name]: _removed, ...rest } = current
      return rest
    })
    // Changed details are a new submission; an unchanged retry reuses the key so the API stays idempotent.
    submissionKeyRef.current = null
  }

  const sendEnquiry = async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setSending(true)
    setFailure('')
    setRetryable(false)
    try {
      if (form.website) {
        setReceipt('received')
        return
      }
      const result = await submitEnquiry({
        submission_key: submissionKeyRef.current || (submissionKeyRef.current = createSubmissionKey()),
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        preferred_destination: form.preferred_destination,
        education_level: form.education_level,
        study_field: form.study_field.trim() || null,
        message: form.message.trim() || null,
        privacy_consent: form.privacy_consent,
      })
      submissionKeyRef.current = null
      setReceipt(result?.reference || 'received')
    } catch (error) {
      setErrors((current) => ({ ...current, ...(error.fields || {}) }))
      setFailure(error.message || 'Your enquiry could not be sent. Please try again.')
      setRetryable(!error.status || error.status >= 500)
    } finally {
      inFlightRef.current = false
      setSending(false)
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    if (inFlightRef.current) return
    setFailure('')
    const nextErrors = {}
    if (form.full_name.trim().length < 2) nextErrors.full_name = 'Enter your full name.'
    if (!validNepaliMobile(form.phone)) nextErrors.phone = `Enter a Nepal mobile number, such as ${siteContent.form.nepaliPhoneExample} or +977 ${siteContent.form.nepaliPhoneExample}.`
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.'
    if (!destinations.includes(form.preferred_destination)) nextErrors.preferred_destination = 'Choose a study destination.'
    if (!studyLevels.some((level) => level.value === form.education_level)) nextErrors.education_level = 'Choose the level you want to study.'
    if (form.study_field.length > LIMITS.study_field) nextErrors.study_field = `Keep the course or subject under ${LIMITS.study_field} characters.`
    if (form.message.length > LIMITS.message) nextErrors.message = `Keep your message under ${LIMITS.message} characters.`
    if (!form.privacy_consent) nextErrors.privacy_consent = 'Consent is required to send your enquiry.'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      document.querySelector(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus()
      return
    }
    await sendEnquiry()
  }

  const resetForm = () => {
    setReceipt('')
    setForm(emptyForm())
    setErrors({})
    setFailure('')
    setRetryable(false)
  }

  if (receipt) return <div className="data-enquiry-success" role="status" aria-live="polite">
    <span className="enquiry-success-check" aria-hidden="true">✓</span>
    <h3>Thank you for your enquiry.</h3>
    <p>A member of the VN Group team will be in touch.</p>
    {receipt !== 'received' && <p>Reference: <strong>{receipt}</strong></p>}
    <button type="button" className="enquiry-send-again" onClick={resetForm}>Send another enquiry</button>
  </div>

  const fieldId = (name) => `home-enquiry-${name}`
  const fieldError = (name) => errors[name] && <span className="data-field-error" id={`${fieldId(name)}-error`}><svg aria-hidden="true" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/><path d="M8 4.7v3.8m0 2.7h.01"/></svg>{errors[name]}</span>
  const fieldProps = (name) => ({ id: fieldId(name), name, value: form[name], onChange: update, 'aria-invalid': !!errors[name], 'aria-describedby': errors[name] ? `${fieldId(name)}-error` : undefined })
  // One wrapper per label text: the label is a grid, so loose text and marks would each take a row.
  const requiredLabel = (label) => <span className="enquiry-field-label">{label}<span className="required-mark" aria-hidden="true">*</span></span>
  const optionalLabel = (label) => <span className="enquiry-field-label">{label}<span className="optional-mark">(optional)</span></span>

  return <form className="data-enquiry-form" onSubmit={submit} noValidate aria-describedby="enquiry-form-note" aria-busy={sending}>
    <div className="enquiry-form-header">
      <h3>Your details</h3>
      <p id="enquiry-form-note">Fields marked <span aria-hidden="true">*</span><span className="sr-only">with an asterisk</span> are required.</p>
    </div>
    {Object.keys(errors).length > 0 && <div className="data-form-error" role="alert" aria-labelledby="enquiry-error-title">
      <strong id="enquiry-error-title">Please check these fields:</strong>
      <ul>{Object.entries(errors).map(([field, message]) => <li key={field}><a href={`#${fieldId(field)}`} onClick={(event) => { event.preventDefault(); document.querySelector(`[name="${field}"]`)?.focus() }}>{message}</a></li>)}</ul>
    </div>}
    <fieldset className="data-enquiry-grid" disabled={sending}>
      <legend className="sr-only">Counselling enquiry</legend>
      <label className="data-enquiry-wide">{requiredLabel('Full name')}<input {...fieldProps('full_name')} autoComplete="name" placeholder="Your full name" maxLength={LIMITS.full_name} required />{fieldError('full_name')}</label>
      <label>{requiredLabel('Phone number')}<input {...fieldProps('phone')} type="tel" autoComplete="tel" inputMode="tel" placeholder={siteContent.form.nepaliPhoneExample} maxLength={LIMITS.phone} required />{fieldError('phone')}</label>
      <label>{requiredLabel('Email')}<input {...fieldProps('email')} type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" required />{fieldError('email')}</label>
      <label>{requiredLabel('Preferred destination')}<select {...fieldProps('preferred_destination')} required>
        <option value="">Choose a country</option>{destinations.map((country) => <option key={country}>{country}</option>)}
      </select>{fieldError('preferred_destination')}</label>
      <label>{requiredLabel('Intended study level')}<select {...fieldProps('education_level')} required>
        <option value="">Choose a level</option>{studyLevels.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
      </select>{fieldError('education_level')}</label>
      <label className="data-enquiry-wide">{optionalLabel('Course or subject of interest')}<input {...fieldProps('study_field')} placeholder="e.g. Nursing, IT, Business" maxLength={LIMITS.study_field} />{fieldError('study_field')}</label>
      <label className="data-enquiry-wide">{optionalLabel('Message')}<textarea {...fieldProps('message')} rows={4} placeholder="Anything you'd like our counsellors to know" maxLength={LIMITS.message} />
        {form.message.length > LIMITS.message * 0.8 && <span className="enquiry-char-count" aria-live="polite">{LIMITS.message - form.message.length} characters left</span>}
        {fieldError('message')}</label>
    </fieldset>
    <label className="data-consent"><input {...fieldProps('privacy_consent')} type="checkbox" value={undefined} checked={form.privacy_consent} required disabled={sending} />
      <span>I agree that VN Group may use these details to respond to my enquiry. Read the <Link to="/privacy">Privacy Policy</Link>.<span className="required-mark" aria-hidden="true">*</span></span>
    </label>
    {fieldError('privacy_consent')}
    <label className="data-honeypot" aria-hidden="true">Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={update} /></label>
    {failure && <p className="data-form-error" role="alert">{failure} {retryable && <button type="button" className="enquiry-retry" onClick={sendEnquiry} disabled={sending}>{sending ? 'Retrying…' : 'Try again'}</button>}</p>}
    <button type="submit" className="button enquiry-submit" disabled={sending}>{sending ? <><span className="enquiry-spinner" aria-hidden="true" />Sending…</> : <>Book free counselling</>}</button>
    <p className="enquiry-privacy-note"><svg aria-hidden="true" viewBox="0 0 16 16"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/></svg>Your details are only used to respond to your enquiry.</p>
  </form>
}
