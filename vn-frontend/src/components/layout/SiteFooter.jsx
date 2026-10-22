import { Link } from 'react-router-dom'
import { siteContent, siteContentReady } from '../../data/siteContent'

function FooterIcon({ name }) {
  const paths = {
    pin: <><path d="M16 8.2c0 4.2-6 9-6 9s-6-4.8-6-9a6 6 0 1 1 12 0Z"/><circle cx="10" cy="8" r="2"/></>,
    phone: <path d="M6 3.5 8.5 7 7 8.5c.8 1.6 2 2.8 3.6 3.6l1.5-1.5 3.5 2.5-.8 3c-.2.7-.9 1.1-1.6 1C7.8 16.2 3.8 12.2 3 6.8c-.1-.7.3-1.4 1-1.6z"/>,
    mail: <><rect x="2.8" y="4.5" width="14.4" height="11" rx="1.3"/><path d="m3.5 5.5 6.5 5 6.5-5"/></>,
    clock: <><circle cx="10" cy="10" r="7"/><path d="M10 6v4l2.8 1.8"/></>,
    map: <><path d="m2.8 5 4.8-2 4.8 2 4.8-2v12l-4.8 2-4.8-2-4.8 2z"/><path d="M7.6 3v12m4.8-10v12"/></>,
  }
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function FooterLink({ item }) {
  return item.to.startsWith('/') ? <Link to={item.to}>{item.label}</Link> : <a href={item.to}>{item.label}</a>
}

export default function SiteFooter() {
  const { brand, footer, contact, home } = siteContent
  const socials = contact.socials.filter((item) => siteContentReady(item.label) && siteContentReady(item.url))
  const serviceLinks = home.services.map((service) => ({ label: service.title === 'IELTS/PTE Guidance' ? 'IELTS/PTE' : service.title, to: `/#service-${service.id}` }))
  const addressReady = siteContentReady(contact.address)
  const directionsUrl = siteContentReady(contact.mapEmbedUrl)
    ? contact.mapEmbedUrl
    : addressReady ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}` : ''
  const phoneReady = siteContentReady(contact.phone)
  const whatsappReady = siteContentReady(contact.whatsappNumber)
  const emailReady = siteContentReady(contact.email)
  const hoursReady = siteContentReady(contact.officeHours)
  const logo = siteContent.brand.logo
  const lightLogo = siteContent.brand.lightLogo

  return <footer className="site-footer">
    <div className="footer-main">
      <div className="footer-brand-column">
        <Link className={`footer-logo-badge${lightLogo ? ' is-light-logo' : ''}`} to="/" aria-label={`${brand.name} home`}>
          <img src={(lightLogo || logo).src} alt={(lightLogo || logo).alt} />
        </Link>
        <p className="footer-description">{brand.tagline}</p>
        {socials.length > 0 && <nav className="footer-socials" aria-label="Social media">
          {socials.map((social) => <a key={social.label} href={social.url} target="_blank" rel="noreferrer" aria-label={social.label}><span aria-hidden="true">{social.icon || social.label.slice(0, 1)}</span></a>)}
        </nav>}
        {Number.isFinite(Number(brand.foundedYear)) && <p className="footer-founding-note">Guiding Nepali students since {brand.foundedYear}</p>}
      </div>

      <nav className="footer-link-column" aria-label="Quick links">
        <h2>Quick Links</h2>
        {footer.explore.map((item) => <FooterLink key={item.label} item={item} />)}
      </nav>

      <nav className="footer-link-column footer-service-column" aria-label="Services">
        <h2>Services</h2>
        {serviceLinks.map((item) => <FooterLink key={item.label} item={item} />)}
      </nav>

      <div className="footer-contact-column">
        <h2>Contact</h2>
        {addressReady && <p className="footer-contact-item"><FooterIcon name="pin" />{contact.address}</p>}
        {phoneReady && <a className="footer-contact-item" href={`tel:${contact.phone}`}><FooterIcon name="phone" />{contact.phone}</a>}
        {whatsappReady && <a className="footer-contact-item" href={`https://wa.me/${contact.whatsappNumber.replace(/\D/g, '')}`}><FooterIcon name="phone" />WhatsApp</a>}
        {emailReady && <a className="footer-contact-item" href={`mailto:${contact.email}`}><FooterIcon name="mail" />{contact.email}</a>}
        {hoursReady && <p className="footer-contact-item"><FooterIcon name="clock" />{contact.officeHours}</p>}
        {directionsUrl && <a className="footer-contact-item footer-directions" href={directionsUrl} target="_blank" rel="noreferrer"><FooterIcon name="map" />Get directions</a>}
      </div>
    </div>

    <div className="footer-bottom">
      <span>© {new Date().getFullYear()} {brand.name}. All rights reserved.</span>
      <nav aria-label="Legal links">{footer.legal.map((item) => <FooterLink key={item.label} item={item} />)}</nav>
    </div>
  </footer>
}
