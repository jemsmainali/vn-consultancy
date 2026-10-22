import ResponsiveImage from '../../ResponsiveImage'
import { siteContent, siteContentReady, siteImages } from '../../data/siteContent'
import EnquiryForm from './EnquiryForm'
import SectionHeading from './SectionHeading'

function ContactIcon({ kind }) {
  const paths = {
    phone: <path d="M6 3.5 8.5 7 7 8.5c.8 1.6 2 2.8 3.6 3.6l1.5-1.5 3.5 2.5-.8 3c-.2.7-.9 1.1-1.6 1C7.8 16.2 3.8 12.2 3 6.8c-.1-.7.3-1.4 1-1.6z"/>,
    mail: <><rect x="2.8" y="4.5" width="14.4" height="11" rx="1.3"/><path d="m3.5 5.5 6.5 5 6.5-5"/></>,
    clock: <><circle cx="10" cy="10" r="7"/><path d="M10 6v4l2.8 1.8"/></>,
  }
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">{paths[kind]}</svg>
}

export default function EnquirySection() {
  const { phone, whatsappNumber, email, officeHours, whatsappMessage } = siteContent.contact
  const contactItems = [
    siteContentReady(phone) && { kind: 'phone', label: 'Phone', value: phone, href: `tel:${phone}` },
    siteContentReady(whatsappNumber) && { kind: 'phone', label: 'WhatsApp', value: 'WhatsApp', href: `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(siteContentReady(whatsappMessage) ? whatsappMessage : '')}` },
    siteContentReady(email) && { kind: 'mail', label: 'Email', value: email, href: `mailto:${email}` },
    siteContentReady(officeHours) && { kind: 'clock', label: 'Office hours', value: officeHours },
  ].filter(Boolean)

  return <section id="enquire" className="data-section enquiry-data-section">
    <div className="data-container enquiry-data-layout">
      <div className="enquiry-intro-column">
        <SectionHeading eyebrow="Free counselling" title="Tell us what you’re thinking about." centered={false} />
        <p className="enquiry-data-intro">Share your contact details and a few study preferences to start an enquiry.</p>
        <div className="enquiry-next-steps">
          <h3>What happens next</h3>
          <ol>
            <li><span>1</span><p>Send your details</p></li>
            <li><span>2</span><p>A VN Group counsellor contacts you</p></li>
            <li><span>3</span><p>You get a clear, personal study plan</p></li>
          </ol>
        </div>
        {contactItems.length > 0 && <address className="enquiry-contact-card" aria-label="Contact VN Group">
          {contactItems.map((item) => <div className="enquiry-contact-item" key={item.label}>
            <ContactIcon kind={item.kind} />
            <span><small>{item.label}</small>{item.href ? <a href={item.href}>{item.value}</a> : <span>{item.value}</span>}</span>
          </div>)}
        </address>}
        {siteImages.counselling && <div className="enquiry-counselling-photo"><ResponsiveImage image={siteImages.counselling} className="enquiry-counselling-image" /></div>}
      </div>
      <div className="enquiry-data-card"><div className="enquiry-card-accent" aria-hidden="true" /><EnquiryForm /></div>
    </div>
  </section>
}
