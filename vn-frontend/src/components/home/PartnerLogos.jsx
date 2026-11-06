import { useState } from 'react'
import ResponsiveImage from '../../ResponsiveImage'
import { siteContentReady, siteContent } from '../../data/siteContent'
import SectionHeading from './SectionHeading'

const VISIT_IMAGE_SIZES = '(max-width: 640px) 78vw, 400px'
// Each half of the looping track needs enough cards to cover wide screens.
const MIN_CARDS_PER_LOOP = 8
const monthYear = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const formatVisitDate = (value) => monthYear.format(new Date(`${value}-01T00:00:00Z`))

// Newest first by 'YYYY-MM'; undated visits keep their listed order after the dated ones.
const byNewest = (a, b) => (b.date || '').localeCompare(a.date || '')

function VisitCard({ visit, decorative, onUnavailable }) {
  const { image, title, place, date, description, tag } = visit
  const meta = [place, date && formatVisitDate(date)].filter(Boolean)
  return <article className={`partner-marquee-card${decorative ? ' is-repeat' : ''}`} aria-hidden={decorative || undefined}>
    <div className="partner-marquee-frame">
      <ResponsiveImage image={{ ...image, sizes: VISIT_IMAGE_SIZES }} className="partner-marquee-image" alt={decorative ? '' : image.alt} onUnavailable={onUnavailable} />
      {tag && <span className="partner-marquee-tag">{tag}</span>}
    </div>
    <div className="partner-marquee-body">
      <h3>{title}</h3>
      {!!meta.length && <p className="partner-marquee-meta">
        {place}{place && date && <span aria-hidden="true"> · </span>}{date && <time dateTime={date}>{formatVisitDate(date)}</time>}
      </p>}
      {description && <p className="partner-marquee-description">{description}</p>}
    </div>
  </article>
}

function PartnerVisits() {
  const [paused, setPaused] = useState(false)
  // Titles of visits whose photo failed to load; those cards are hidden like visits without a photo.
  const [unavailable, setUnavailable] = useState(() => new Set())
  const visits = siteContent.home.partnerVisits
    .filter((visit) => visit.image && visit.title && !unavailable.has(visit.title))
    .sort(byNewest)
  if (!visits.length) return null
  const hide = (title) => setUnavailable((current) => current.has(title) ? current : new Set(current).add(title))
  const repeats = Math.ceil(MIN_CARDS_PER_LOOP / visits.length)
  const loop = Array.from({ length: repeats }, (_, round) => visits.map((visit) => ({ visit, round }))).flat()
  return <section id="partner-visits-title" className="data-section partner-marquee-section" aria-labelledby="partner-visits-heading">
    <div className="data-container">
      <SectionHeading id="partner-visits-heading" eyebrow="In person" title="Partner visits and official meetings" description="Our team visiting institutions and meeting officials in Nepal and abroad." />
    </div>
    {/* Focusable so keyboard users can pause it (focus-within) or scroll it when motion is reduced. */}
    <div className={`partner-marquee${paused ? ' is-paused' : ''}`} style={{ '--marquee-duration': `${loop.length * 6}s` }} role="region" aria-label="Visit and meeting photos" tabIndex={0}>
      <div className="partner-marquee-track">
        {[0, 1].map((half) => <div key={half} className={`partner-marquee-set${half ? ' is-clone' : ''}`} aria-hidden={half ? true : undefined}>
          {loop.map(({ visit, round }) => <VisitCard key={`${visit.title}-${round}`} visit={visit} decorative={half > 0 || round > 0} onUnavailable={() => hide(visit.title)} />)}
        </div>)}
      </div>
    </div>
    <div className="data-container partner-marquee-controls">
      <button type="button" className="partner-marquee-toggle" onClick={() => setPaused((value) => !value)}>
        {paused ? <><svg aria-hidden="true" viewBox="0 0 16 16"><path d="M5 3.5v9l7-4.5z"/></svg>Play</> : <><svg aria-hidden="true" viewBox="0 0 16 16"><path d="M5 3.5v9M11 3.5v9"/></svg>Pause</>}
        <span className="sr-only"> visit photo scrolling</span>
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
