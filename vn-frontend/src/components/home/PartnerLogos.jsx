import { useState } from 'react'
import ResponsiveImage from '../../ResponsiveImage'
import { siteContentReady, siteContent } from '../../data/siteContent'
import SectionHeading from './SectionHeading'
import ScrollReveal from '../../ScrollReveal'

function VisitCard({ image, caption }) {
  const [available, setAvailable] = useState(true)
  if (!available) return null
  return <ScrollReveal as="figure" className="partner-visit-data-card">
    <ResponsiveImage image={image} className="partner-visit-data-image" onUnavailable={() => setAvailable(false)} />
    <figcaption>{caption}</figcaption>
  </ScrollReveal>
}

function PartnerVisits() {
  const visits = siteContent.home.partnerVisits
  if (!visits.length) return null
  return <section id="partner-visits-title" className="data-section partner-visits-data-section">
    <div className="data-container"><SectionHeading eyebrow="Our partners" title="Partner visits" />
      <div className="partner-visit-data-grid">
        {visits.map(({ image, caption }) => <VisitCard key={caption} image={image} caption={caption} />)}
      </div>
    </div>
  </section>
}

function Logo({ logo }) {
  const [visible, setVisible] = useState(true)
  if (!visible || !siteContentReady(logo.src) || !siteContentReady(logo.alt)) return null
  return <img src={logo.src} alt={logo.alt} loading="lazy" onError={() => setVisible(false)} />
}

export default function PartnerLogos() {
  const logos = siteContent.home.partnerLogos.filter((logo) => siteContentReady(logo.src) && siteContentReady(logo.alt))
  return <>
    {!!logos.length && <section className="data-section partner-logos-section">
      <div className="data-container"><SectionHeading eyebrow="Education partners" title="Institutions we work with" />
        <div className="partner-logo-row">{logos.map((logo) => <Logo key={logo.name} logo={logo} />)}</div>
      </div>
    </section>}
    <PartnerVisits />
  </>
}
