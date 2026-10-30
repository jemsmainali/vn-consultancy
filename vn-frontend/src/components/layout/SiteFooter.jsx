import { Link, useLocation } from 'react-router-dom'
import { formatPhoneDisplay, siteContent, siteContentReady, yearsOfExperience } from '../../data/siteContent'
import CountryFlag from '../CountryFlag'
import { destinationPath, destinations } from '../../data/destinations/registry'

function FooterIcon({ name }) {
  const paths = {
    pin: <><path d="M16 8.2c0 4.2-6 9-6 9s-6-4.8-6-9a6 6 0 1 1 12 0Z"/><circle cx="10" cy="8" r="2"/></>,
    phone: <path d="M6 3.5 8.5 7 7 8.5c.8 1.6 2 2.8 3.6 3.6l1.5-1.5 3.5 2.5-.8 3c-.2.7-.9 1.1-1.6 1C7.8 16.2 3.8 12.2 3 6.8c-.1-.7.3-1.4 1-1.6z"/>,
    whatsapp: <><path d="M17 9.6a6.9 6.9 0 0 1-10.1 6.1L3 17l1.3-3.8A6.9 6.9 0 1 1 17 9.6Z"/><path d="M7.6 7.4c.4 2 1.9 3.6 3.9 4l.9-.9 1.6.6c-.2 1.1-1.1 1.7-2.2 1.6-2.8-.4-5.1-2.7-5.5-5.5-.1-1.1.5-2 1.6-2.2l.6 1.6z"/></>,
    mail: <><rect x="2.8" y="4.5" width="14.4" height="11" rx="1.3"/><path d="m3.5 5.5 6.5 5 6.5-5"/></>,
    clock: <><circle cx="10" cy="10" r="7"/><path d="M10 6v4l2.8 1.8"/></>,
    map: <><path d="m2.8 5 4.8-2 4.8 2 4.8-2v12l-4.8 2-4.8-2-4.8 2z"/><path d="M7.6 3v12m4.8-10v12"/></>,
  }
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function FooterLink({ item, children }) {
  return item.to.startsWith('/') ? <Link to={item.to}>{children || item.label}</Link> : <a href={item.to}>{children || item.label}</a>
}

export default function SiteFooter() {
  const location = useLocation()
  const { brand, footer, contact } = siteContent
  const socials = contact.socials.filter((item) => siteContentReady(item.label) && siteContentReady(item.url))
  const addressReady = siteContentReady(contact.address)
  const directionsUrl = siteContentReady(contact.mapEmbedUrl)
    ? contact.mapEmbedUrl
    : addressReady ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}` : ''
  const whatsappReady = siteContentReady(contact.whatsappNumber)
  const logo = brand.lightLogo || brand.logo
  const foundedReady = Number.isFinite(Number(brand.foundedYear))
  // The home and contact pages already end with the enquiry form, so the call-to-action band would repeat it.
  const showCta = !['/', '/contact'].includes(location.pathname)

  return <footer className="vn-footer">
    {showCta && <div className="vn-footer-cta">
      <div>
        <p className="vn-footer-eyebrow">Free counselling</p>
        <h2>Ready to plan your study abroad journey?</h2>
      </div>
      <Link className="vn-footer-cta-button" to="/#enquire">Book free counselling <span aria-hidden="true">→</span></Link>
    </div>}

    <div className="vn-footer-main">
      <div className="vn-footer-brand">
        <Link className={`vn-footer-logo${brand.lightLogo ? ' is-light-logo' : ''}`} to="/" aria-label={`${brand.name} home`}>
          <img src={logo.src} alt={logo.alt} width="184" height="48" loading="lazy" />
        </Link>
        <p className="vn-footer-description">{siteContentReady(footer.description) ? footer.description : brand.tagline}</p>
        {foundedReady && <p className="vn-footer-since">
          <strong>Since {brand.foundedYear}</strong><span aria-hidden="true">·</span>{yearsOfExperience()}+ years guiding Nepali students
        </p>}
        {socials.length > 0 && <nav className="vn-footer-socials" aria-label="Social media">
          {socials.map((social) => <a key={social.label} href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.label}><span aria-hidden="true">{social.icon || social.label.slice(0, 1)}</span></a>)}
        </nav>}
      </div>

      <nav className="vn-footer-column" aria-labelledby="footer-quick-links">
        <h2 id="footer-quick-links">Quick links</h2>
        <ul>{footer.explore.map((item) => <li key={item.label}><FooterLink item={item} /></li>)}</ul>
      </nav>

      <nav className="vn-footer-column" aria-labelledby="footer-destinations">
        <h2 id="footer-destinations">Study destinations</h2>
        <ul className="vn-footer-destinations">{destinations.map((country) => <li key={country.slug}>
          <Link to={destinationPath(country)}><span className="vn-footer-flag" aria-hidden="true"><CountryFlag code={country.code} name="" size={13} /></span>{country.name}</Link>
        </li>)}</ul>
      </nav>

      <div className="vn-footer-column vn-footer-contact">
        <h2>Get in touch</h2>
        <address>
          {addressReady && <p className="vn-footer-contact-item"><FooterIcon name="pin" />{contact.address}</p>}
          {siteContentReady(contact.phone) && <a className="vn-footer-contact-item" href={`tel:${contact.phone}`}><FooterIcon name="phone" />{formatPhoneDisplay(contact.phone)}</a>}
          {whatsappReady && <a className="vn-footer-contact-item" href={`https://wa.me/${contact.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"><FooterIcon name="whatsapp" />Chat on WhatsApp</a>}
          {siteContentReady(contact.email) && <a className="vn-footer-contact-item" href={`mailto:${contact.email}`}><FooterIcon name="mail" />{contact.email}</a>}
          {siteContentReady(contact.officeHours) && <p className="vn-footer-contact-item"><FooterIcon name="clock" />{contact.officeHours}</p>}
          {directionsUrl && <a className="vn-footer-contact-item" href={directionsUrl} target="_blank" rel="noopener noreferrer"><FooterIcon name="map" />Get directions</a>}
        </address>
      </div>
    </div>

    <div className="vn-footer-bottom">
      <p>© {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
      <nav aria-label="Legal links"><ul>{footer.legal.map((item) => <li key={item.label}><FooterLink item={item} /></li>)}</ul></nav>
    </div>
  </footer>
}
