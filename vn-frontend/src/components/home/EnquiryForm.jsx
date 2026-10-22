import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { submitEnquiry } from '../../api/enquiry'
import { siteContent } from '../../data/siteContent'

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

export default function EnquiryForm() {
  const location = useLocation()
  const queryCountry = new URLSearchParams(location.search).get('country') || ''
  const countries = siteContent.home.enquiry.countries
  const qualifications = siteContent.home.enquiry.qualifications
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', preferred_destination: countries.includes(queryCountry) ? queryCountry : '', education_level: '', privacy_consent: false, website: '' })
  const [errors, setErrors] = useState({})
  const [failure, setFailure] = useState('')
  const [sending, setSending] = useState(false)
  const [receipt, setReceipt] = useState('')

  const update = (event) => {
    const { name, value, checked, type } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setFailure('')
    const nextErrors = {}
    if (form.full_name.trim().length < 2) nextErrors.full_name = 'Enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Enter a valid email address.'
    if (!validNepaliMobile(form.phone)) nextErrors.phone = `Enter a Nepal mobile number, such as ${siteContent.form.nepaliPhoneExample} or +977 ${siteContent.form.nepaliPhoneExample}.`
    if (!countries.includes(form.preferred_destination)) nextErrors.preferred_destination = 'Choose a country.'
    if (!qualifications.includes(form.education_level)) nextErrors.education_level = 'Choose your last qualification.'
    if (!form.privacy_consent) nextErrors.privacy_consent = 'Consent is required to send your enquiry.'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    setSending(true)
    try {
      if (form.website) {
        setReceipt('received')
        return
      }
      const result = await submitEnquiry({
        submission_key: createSubmissionKey(),
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        preferred_destination: form.preferred_destination,
        education_level: form.education_level,
        privacy_consent: form.privacy_consent,
      })
      setReceipt(result?.reference || 'received')
    } catch (error) {
      setErrors((current) => ({ ...current, ...(error.fields || {}) }))
      setFailure(error.message || 'Your enquiry could not be sent. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (receipt) return <div className="data-enquiry-success" role="status" aria-live="polite">
    <span className="enquiry-success-check" aria-hidden="true">✓</span>
    <h3>Thank you for your enquiry.</h3>
    <p>A member of the VN Group team will be in touch.</p>
    {receipt !== 'received' && <p>Reference: <strong>{receipt}</strong></p>}
    <button type="button" className="enquiry-send-again" onClick={() => { setReceipt(''); setForm({ full_name: '', email: '', phone: '', preferred_destination: '', education_level: '', privacy_consent: false, website: '' }); setErrors({}); setFailure('') }}>Send another enquiry</button>
  </div>

  const fieldError = (name) => errors[name] && <span className="data-field-error" id={`home-enquiry-${name}-error`}><svg aria-hidden="true" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/><path d="M8 4.7v3.8m0 2.7h.01"/></svg>{errors[name]}</span>
  const requiredLabel = (label) => <>{label}<span className="required-mark" aria-hidden="true">*</span></>

  return <form className="data-enquiry-form" onSubmit={submit} noValidate>
    <div className="data-enquiry-grid">
      <label>{requiredLabel('Full name')}<input name="full_name" autoComplete="name" placeholder="Your full name" value={form.full_name} onChange={update} required aria-invalid={!!errors.full_name} aria-describedby={errors.full_name ? 'home-enquiry-full_name-error' : undefined} />{fieldError('full_name')}</label>
      <label>{requiredLabel('Email')}<input name="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={update} required aria-invalid={!!errors.email} aria-describedby={errors.email ? 'home-enquiry-email-error' : undefined} />{fieldError('email')}</label>
      <label>{requiredLabel('Phone')}<input name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder={siteContent.form.nepaliPhoneExample} value={form.phone} onChange={update} required aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'home-enquiry-phone-error' : undefined} />{fieldError('phone')}</label>
      <label>{requiredLabel('Preferred country')}<select name="preferred_destination" value={form.preferred_destination} onChange={update} required aria-invalid={!!errors.preferred_destination} aria-describedby={errors.preferred_destination ? 'home-enquiry-preferred_destination-error' : undefined}>
        <option value="">Choose a country</option>{countries.map((country) => <option key={country}>{country}</option>)}
      </select>{fieldError('preferred_destination')}</label>
      <label className="data-enquiry-wide">{requiredLabel('Last qualification')}<select name="education_level" value={form.education_level} onChange={update} required aria-invalid={!!errors.education_level} aria-describedby={errors.education_level ? 'home-enquiry-education_level-error' : undefined}>
        <option value="">Choose your last qualification</option>{qualifications.map((qualification) => <option key={qualification}>{qualification}</option>)}
      </select>{fieldError('education_level')}</label>
    </div>
    <label className="data-consent"><input type="checkbox" name="privacy_consent" checked={form.privacy_consent} onChange={update} aria-invalid={!!errors.privacy_consent} aria-describedby={errors.privacy_consent ? 'home-enquiry-privacy_consent-error' : undefined} />
      <span>I agree that VN Group may use these details to respond to my enquiry. Read the <Link to="/privacy">Privacy Policy</Link>.</span>
    </label>
    {fieldError('privacy_consent')}
    <label className="data-honeypot" aria-hidden="true">Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={update} /></label>
    {failure && <p className="data-form-error" role="alert">{failure}</p>}
    <button type="submit" className="button enquiry-submit" disabled={sending}>{sending ? <><span className="enquiry-spinner" aria-hidden="true" />Sending…</> : <>Send enquiry <span aria-hidden="true">→</span></>}</button>
    <p className="enquiry-privacy-note"><svg aria-hidden="true" viewBox="0 0 16 16"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/></svg>Your details are only used to respond to your enquiry.</p>
  </form>
}
