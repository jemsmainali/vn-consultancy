import { useState } from 'react'
import ResponsiveImage from '../../ResponsiveImage'
import { siteContentReady, siteContent } from '../../data/siteContent'
import SectionHeading from './SectionHeading'

const VISIT_IMAGE_SIZES = '(max-width: 640px) 78vw, 400px'
// Each half of the looping track needs enough cards to cover wide screens.
const MIN_CARDS_PER_LOOP = 8

function VisitPlaceholder() {
  return <div className="partner-marquee-placeholder" role="img" aria-label="Partner visit photo coming soon">
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-8 8"/></svg>
    <span>Photo coming soon</span>
  </div>
}

function VisitCard({ image, caption, decorative }) {
  const [available, setAvailable] = useState(Boolean(image))
  return <figure className={`partner-marquee-card${decorative ? ' is-repeat' : ''}`} aria-hidden={decorative || undefined}>
    <div className="partner-marquee-frame">
      {available
        ? <ResponsiveImage image={{ ...image, sizes: VISIT_IMAGE_SIZES }} className="partner-marquee-image" alt={decorative ? '' : image.alt} onUnavailable={() => setAvailable(false)} />
        : <VisitPlaceholder />}
    </div>
    <figcaption>{caption}</figcaption>
  </figure>
}

function PartnerVisits() {
  const visits = siteContent.home.partnerVisits
  const [paused, setPaused] = useState(false)
  if (!visits.length) return null
  const repeats = Math.ceil(MIN_CARDS_PER_LOOP / visits.length)
  const loop = Array.from({ length: repeats }, (_, round) => visits.map((visit) => ({ ...visit, round }))).flat()
  return <section id="partner-visits-title" className="data-section partner-marquee-section" aria-labelledby="partner-visits-heading">
    <div className="data-container">
      <SectionHeading id="partner-visits-heading" eyebrow="Our partners" title="Partner visits" description="Our team meeting partner institutions and their representatives." />
    </div>
    {/* Focusable so keyboard users can pause it (focus-within) or scroll it when motion is reduced. */}
    <div className={`partner-marquee${paused ? ' is-paused' : ''}`} style={{ '--marquee-duration': `${loop.length * 6}s` }} role="region" aria-label="Partner visit photos" tabIndex={0}>
      <div className="partner-marquee-track">
        {[0, 1].map((half) => <div key={half} className={`partner-marquee-set${half ? ' is-clone' : ''}`} aria-hidden={half ? true : undefined}>
          {loop.map(({ image, caption, round }) => <VisitCard key={`${caption}-${round}`} image={image} caption={caption} decorative={half > 0 || round > 0} />)}
        </div>)}
      </div>
    </div>
    <div className="data-container partner-marquee-controls">
      <button type="button" className="partner-marquee-toggle" onClick={() => setPaused((value) => !value)}>
        {paused ? <><svg aria-hidden="true" viewBox="0 0 16 16"><path d="M5 3.5v9l7-4.5z"/></svg>Play</> : <><svg aria-hidden="true" viewBox="0 0 16 16"><path d="M5 3.5v9M11 3.5v9"/></svg>Pause</>}
        <span className="sr-only"> partner photo scrolling</span>
      </button>
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
