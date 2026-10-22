import { siteContent, siteContentReady } from '../../data/siteContent'
import EnquiryForm from './EnquiryForm'

function ContactIcon({ kind }) {
  const paths = {
    phone: <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.35 1.9.69 2.8a2 2 0 0 1-.45 2.11L8.08 9.92a16 16 0 0 0 6 6l1.29-1.27a2 2 0 0 1 2.11-.45c.9.34 1.84.57 2.8.69A2 2 0 0 1 22 16.92Z"/></>,
    mail: <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></>,
    whatsapp: <><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/><path d="M8.5 9.5c.6 2.5 2.5 4.4 5 5l1.2-1.2 2 .8c-.3 1.4-1.4 2.2-2.8 2-3.5-.5-6.5-3.5-7-7-.2-1.4.6-2.5 2-2.8l.8 2z"/></>,
    arrow: <><path d="M7 17 17 7"/><path d="M7 7h10v10"/></>,
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[kind]}</svg>
}

function formatPhoneDisplay(phone) {
  const digits = phone.replace(/\D/g, '')
  const national = digits.startsWith('977') ? digits.slice(3) : digits
  if (digits.startsWith('977') && national.length === 10) {
    return `+977 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`
  }
  return phone
}

export default function EnquirySection() {
  const { phone, whatsappNumber, email, whatsappMessage } = siteContent.contact
  const contactItems = [
    siteContentReady(phone) && { kind: 'phone', label: 'Call us', value: formatPhoneDisplay(phone), href: `tel:${phone}` },
    siteContentReady(whatsappNumber) && { kind: 'whatsapp', label: 'WhatsApp', value: 'Chat on WhatsApp', href: `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(siteContentReady(whatsappMessage) ? whatsappMessage : '')}`, external: true },
    siteContentReady(email) && { kind: 'mail', label: 'Email us', value: email, href: `mailto:${email}` },
  ].filter(Boolean)

  return <section id="enquire" className="data-section enquiry-data-section">
    <div className="data-container enquiry-data-layout">
      <div className="enquiry-intro-column">
        <header className="enquiry-intro-heading">
          <p className="enquiry-eyebrow">FREE COUNSELLING</p>
          <h2>Tell us what you're thinking about.</h2>
        </header>
        <p className="enquiry-data-intro">Share your contact details and a few study preferences to start an enquiry.</p>
        <div className="enquiry-next-steps">
          <h3>What happens next</h3>
          <ol>
            <li><span aria-hidden="true">1</span><p>Send your details</p></li>
            <li><span aria-hidden="true">2</span><p>A VN Group counsellor contacts you</p></li>
            <li><span aria-hidden="true">3</span><p>You get a clear, personal study plan</p></li>
          </ol>
        </div>
        {contactItems.length > 0 && <div className="enquiry-contact-divider" aria-hidden="true" />}
        {contactItems.length > 0 && <address className="enquiry-contact-block" aria-label="Contact VN Group">
          <h3>Prefer to talk directly?</h3>
          <ul className="enquiry-contact-list">
            {contactItems.map((item) => <li key={item.label}>
              <a className={`enquiry-contact-link${item.kind === 'whatsapp' ? ' is-whatsapp' : ''}`} href={item.href} target={item.external ? '_blank' : undefined} rel={item.external ? 'noopener noreferrer' : undefined}>
                <span className="enquiry-contact-icon"><ContactIcon kind={item.kind} /></span>
                <span className="enquiry-contact-copy"><small>{item.label}</small><strong>{item.value}</strong></span>
                <span className="enquiry-contact-arrow"><ContactIcon kind="arrow" /></span>
              </a>
            </li>)}
          </ul>
        </address>}
      </div>
      <div className="enquiry-data-card"><div className="enquiry-card-accent" aria-hidden="true" /><EnquiryForm /></div>
    </div>
  </section>
}
