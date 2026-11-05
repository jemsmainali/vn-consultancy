import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import CountryFlag from '../components/CountryFlag'
import ScrollReveal from '../ScrollReveal'
import VerifiedGuide from '../components/destinations/VerifiedGuide'
import { countryProfile, countryProfiles } from '../data/destinations/countries'
import { destinationByName, destinationPath } from '../data/destinations/registry'
import { claimTypes, exchangeRates, formatLocal, formatNpr, formatNprRange, formatRange, researchDate } from '../data/destinations/meta'

const enquiryHref = (name) => `/?country=${encodeURIComponent(name)}#enquire`
const sum = (rows, index) => rows.reduce((total, row) => total + row.range[index], 0)

export function ClaimBadge({ type }) {
  const claim = claimTypes[type]
  if (!claim) return null
  return <span className={`claim-badge is-${type}`} title={claim.detail}>{claim.label}</span>
}

function DestinationImage({ image, className = '', loading = 'lazy', priority }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <div className={`destination-image-fallback ${className}`} aria-hidden="true" />
  return <img className={className} src={image.src} srcSet={image.srcSet} sizes={image.sizes} width={image.width} height={image.height} alt={image.alt} loading={loading} decoding="async" {...(priority ? { fetchpriority: 'high' } : {})} onError={() => setFailed(true)} />
}

function ImageCredit({ credit }) {
  if (!credit) return null
  return <p className="destination-image-credit">Photo: <a href={credit.page} target="_blank" rel="noopener noreferrer">{credit.author}</a>, <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer license">{credit.license}</a>, via {credit.source}. Illustrative image, not a VN Group activity.</p>
}

function ExternalLink({ href, children }) {
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}<span className="sr-only"> (opens in a new tab)</span><svg className="external-icon" aria-hidden="true" viewBox="0 0 16 16"><path d="M6 3H3v10h10v-3M9 2h5v5M14 2 7 9"/></svg></a>
}

function RateNote() {
  return <p className="rate-note">NPR amounts are approximate, using <ExternalLink href={exchangeRates.source.url}>Nepal Rastra Bank</ExternalLink> selling rates for {exchangeRates.date}{' '}(NZD derived via the <ExternalLink href={exchangeRates.crossSource.url}>ECB euro reference rate</ExternalLink>). Your bank’s rate and fees will differ.</p>
}

const quickFact = (country, label) => country.quickFacts.find((fact) => fact.label === label)?.value

// ---------- Hub ----------

const compareRows = [
  { label: 'Student visa', value: (c) => c.visa.name },
  { label: 'Typical bachelor’s tuition (per year, estimate)', value: (c) => {
    const row = c.costs.tuition.find((item) => /bachelor|licence/i.test(item.label)) || c.costs.tuition[0]
    return <>{formatRange(row.range, c.currency)}<small>{formatNprRange(row.range, c.currency)}</small></>
  } },
  { label: 'Monthly living costs (estimate)', value: (c) => {
    const range = [sum(c.costs.living, 0), sum(c.costs.living, 1)]
    return <>{formatRange(range, c.currency)}<small>{formatNprRange(range, c.currency)}</small></>
  } },
  { label: 'Official funds rule', value: (c) => c.costs.requirement.amount
    ? <>{formatLocal(c.costs.requirement.amount, c.currency)}{c.costs.requirement.amountLabel ? ` (${c.costs.requirement.amountLabel})` : ' per year'}<small>≈ {formatNpr(c.costs.requirement.amount, c.currency)}</small><ClaimBadge type={c.costs.requirement.type} /></>
    : <>No single amount – see guide<ClaimBadge type={c.costs.requirement.type} /></> },
  { label: 'Work while studying', value: (c) => quickFact(c, 'Work while studying') },
  { label: 'After graduation', value: (c) => quickFact(c, 'After graduation') },
  { label: 'Main intakes', value: (c) => quickFact(c, 'Main intakes') },
]

function CompareDestinations() {
  const [selected, setSelected] = useState(['australia', 'united-kingdom', 'canada'])
  const chosen = countryProfiles.filter((country) => selected.includes(country.slug))
  const toggle = (slug) => setSelected((current) => current.includes(slug)
    ? current.filter((item) => item !== slug)
    : current.length >= 3 ? [...current.slice(1), slug] : [...current, slug])

  return <section className="data-section compare-section" aria-labelledby="compare-title">
    <div className="data-container">
      <ScrollReveal as="header" className="data-section-heading is-centered">
        <p className="data-eyebrow">Compare</p>
        <h2 id="compare-title">Compare up to three destinations</h2>
        <p className="data-section-description">Estimates are marked as estimates. Official rules link to their sources in each country guide.</p>
      </ScrollReveal>
      <div className="compare-picker" role="group" aria-label="Choose destinations to compare">
        {countryProfiles.map((country) => <button key={country.slug} type="button" aria-pressed={selected.includes(country.slug)} onClick={() => toggle(country.slug)}>
          <CountryFlag code={country.code} name="" size={14} />{country.name}
        </button>)}
      </div>
      {chosen.length > 0 ? <div className="compare-table-wrap" tabIndex={0} role="region" aria-label="Destination comparison table">
        <table className="compare-table">
          <caption className="sr-only">Comparison of {chosen.map((country) => country.name).join(', ')}</caption>
          <thead><tr><td />{chosen.map((country) => <th key={country.slug} scope="col"><Link to={destinationPath(country)}><CountryFlag code={country.code} name="" size={16} />{country.name}</Link></th>)}</tr></thead>
          <tbody>{compareRows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th>{chosen.map((country) => <td key={country.slug}>{row.value(country)}</td>)}</tr>)}</tbody>
        </table>
      </div> : <p className="compare-empty">Choose at least one destination to compare.</p>}
      <RateNote />
    </div>
  </section>
}

export function DestinationsHub() {
  const location = useLocation()
  const legacyCountry = new URLSearchParams(location.search).get('country')
  const legacyMatch = legacyCountry && destinationByName(legacyCountry)
  if (legacyMatch) return <Navigate to={destinationPath(legacyMatch)} replace />

  return <div className="destinations-page">
    <header className="destinations-hero">
      <div className="data-container">
        <p className="data-eyebrow">Study destinations</p>
        <h1>Where could your studies take you?</h1>
        <p>Detailed, dated guides to ten destinations: costs in local currency and Nepali rupees, admission, scholarships, student visas, work rights and options after graduation.</p>
        <p className="destinations-hero-meta"><span>Research checked {researchDate}</span><span>Official sources linked on every page</span></p>
      </div>
    </header>
    <section className="data-section destination-guide-section" aria-labelledby="destination-grid-title">
      <div className="data-container">
        <h2 id="destination-grid-title" className="sr-only">Destination guides</h2>
        <ul className="destination-guide-grid">
          {countryProfiles.map((country, index) => <ScrollReveal as="li" key={country.slug} delay={(index % 3) * 80}>
            <Link className="destination-guide-card" to={destinationPath(country)}>
              <span className="destination-guide-media"><DestinationImage image={country.image} /></span>
              <span className="destination-guide-body">
                <span className="destination-guide-title"><CountryFlag code={country.code} name="" size={22} /><strong>{country.name}</strong></span>
                <span className="destination-guide-summary">{country.cardIntro}</span>
                <span className="destination-guide-facts">
                  <span><small>Visa</small>{country.visa.name}</span>
                  <span><small>Work</small>{quickFact(country, 'Work while studying')}</span>
                </span>
                <span className="destination-guide-cta">Read the {country.name} guide</span>
              </span>
            </Link>
          </ScrollReveal>)}
        </ul>
      </div>
    </section>
    <CompareDestinations />
  </div>
}

// ---------- Detail ----------

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'costs', label: 'Costs' },
  { id: 'admission', label: 'Admission' },
  { id: 'visa', label: 'Student visa' },
  { id: 'fit', label: 'Best suited for' },
  { id: 'sources', label: 'Sources' },
  { id: 'full-guide', label: 'Full guide' },
]

function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible[0]) setActive(visible[0].target.id)
    }, { rootMargin: '-140px 0px -60% 0px' })
    ids.forEach((id) => { const node = document.getElementById(id); if (node) observer.observe(node) })
    return () => observer.disconnect()
  }, [ids])
  return active
}

function DetailSection({ id, letter, title, children, badge }) {
  return <section id={id} className="destination-detail-section" aria-labelledby={`${id}-title`}>
    <ScrollReveal className="destination-detail-head">
      <span className="destination-detail-letter" aria-hidden="true">{letter}</span>
      <h2 id={`${id}-title`}>{title}</h2>
      {badge}
    </ScrollReveal>
    {children}
  </section>
}

function List({ items, className = '' }) {
  return <ul className={`destination-list ${className}`}>{items.map((item) => <li key={typeof item === 'string' ? item : item.text}>{typeof item === 'string' ? item : <>{item.text} {item.type && <ClaimBadge type={item.type} />}</>}</li>)}</ul>
}

function CostTables({ country }) {
  const { costs, currency } = country
  const monthly = [sum(costs.living, 0), sum(costs.living, 1)]
  return <>
    <div className="destination-table-block">
      <div className="destination-table-head"><h3>Typical annual tuition</h3><ClaimBadge type="estimate" /></div>
      <div className="destination-table-wrap" tabIndex={0} role="region" aria-label={`${country.name} tuition table`}>
        <table className="destination-table">
          <thead><tr><th scope="col">Study level / institution</th><th scope="col">{currency} per year</th><th scope="col">Approx. NPR</th></tr></thead>
          <tbody>{costs.tuition.map((row) => <tr key={row.label}><th scope="row">{row.label}{row.note && <small>{row.note}</small>}</th><td>{formatRange(row.range, currency)}</td><td>{formatNprRange(row.range, currency)}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="destination-table-note">{costs.tuitionNote}</p>
    </div>
    <div className="destination-table-block">
      <div className="destination-table-head"><h3>Monthly living costs</h3><ClaimBadge type="estimate" /></div>
      <div className="destination-table-wrap" tabIndex={0} role="region" aria-label={`${country.name} living cost table`}>
        <table className="destination-table">
          <thead><tr><th scope="col">Expense</th><th scope="col">{currency} per month</th><th scope="col">Approx. NPR</th></tr></thead>
          <tbody>
            {costs.living.map((row) => <tr key={row.label}><th scope="row">{row.label}</th><td>{formatRange(row.range, currency)}</td><td>{formatNprRange(row.range, currency)}</td></tr>)}
            <tr className="is-total"><th scope="row">Estimated monthly total</th><td>{formatRange(monthly, currency)}</td><td>{formatNprRange(monthly, currency)}</td></tr>
          </tbody>
        </table>
      </div>
      <p className="destination-table-note">{costs.cityNote}</p>
    </div>
    <aside className={`destination-callout is-${costs.requirement.type}`}>
      <div className="destination-table-head"><h3>Funds you must show for the visa</h3><ClaimBadge type={costs.requirement.type} /></div>
      <p>{costs.requirement.text}</p>
      {costs.requirement.amount && <p className="destination-callout-figure"><strong>{formatLocal(costs.requirement.amount, currency)}</strong>{costs.requirement.amountLabel ? ` (${costs.requirement.amountLabel})` : ' per year'} ≈ {formatNpr(costs.requirement.amount, currency)}</p>}
      <p className="destination-callout-source">Source: <ExternalLink href={costs.requirement.source.url}>{costs.requirement.source.label}</ExternalLink></p>
    </aside>
    <RateNote />
  </>
}

// Already shown on the public page, so the signed-in guide skips them.
const publicGuideParts = ['overview', 'tuition', 'livingCosts', 'financialEvidence', 'applicationTimeline']

export function DestinationDetail() {
  const { slug } = useParams()
  const country = countryProfile(slug)
  const sectionIds = useMemo(() => sections.map((section) => section.id), [])
  const active = useActiveSection(sectionIds)

  if (!country) return <div className="destinations-page"><header className="destinations-hero"><div className="data-container">
    <p className="data-eyebrow">Destination not found</p><h1>We don’t have a guide for that destination yet.</h1>
    <p><Link className="home-text-link" to="/destinations">See all destination guides</Link></p>
  </div></header></div>

  const index = countryProfiles.indexOf(country)
  const previous = countryProfiles[(index - 1 + countryProfiles.length) % countryProfiles.length]
  const next = countryProfiles[(index + 1) % countryProfiles.length]

  return <div className="destinations-page destination-detail">
    <header className="destination-detail-hero">
      <div className="destination-detail-hero-media"><DestinationImage image={country.image} loading="eager" priority /></div>
      <div className="data-container destination-detail-hero-inner">
        <nav className="destination-breadcrumb" aria-label="Breadcrumb"><Link to="/destinations">Destinations</Link><span aria-hidden="true">/</span><span aria-current="page">{country.name}</span></nav>
        <h1><CountryFlag code={country.code} name="" size={30} />Study in {country.name}</h1>
        <p>{country.intro}</p>
        <div className="destination-detail-actions">
          <Link className="home-button glow-cta" to={enquiryHref(country.name)}>Get free advice for {country.name}</Link>
          <Link className="home-button home-button-ghost" to="#costs">See costs</Link>
        </div>
        <p className="destination-updated">Research checked {researchDate} · Rules change: always confirm with the official sources linked on this page.</p>
      </div>
    </header>
    <div className="data-container"><ImageCredit credit={country.image.credit} /></div>

    <dl className="data-container destination-quick-facts">
      {country.quickFacts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}
    </dl>

    <nav className="destination-section-nav" aria-label={`${country.name} guide sections`}>
      <div className="data-container"><ul>{sections.map((section) => <li key={section.id}><Link to={`#${section.id}`} aria-current={active === section.id ? 'true' : undefined}>{section.label}</Link></li>)}</ul></div>
    </nav>

    <div className="data-container destination-detail-body">
      <DetailSection id="overview" letter="A" title="Overview">
        <p className="destination-lead">{country.overview.system}</p>
        <div className="destination-two-col">
          <div><h3>Popular fields</h3><ul className="destination-chips">{country.overview.fields.map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div><h3>Major student cities</h3><ul className="destination-chips">{country.overview.cities.map((item) => <li key={item}>{item}</li>)}</ul></div>
        </div>
        <h3>Key advantages</h3><List items={country.overview.advantages} className="is-checks" />
      </DetailSection>

      <DetailSection id="costs" letter="B" title="Tuition and living costs"><CostTables country={country} /></DetailSection>

      <DetailSection id="admission" letter="C" title="Admission requirements">
        <div className="destination-two-col">
          <div><h3>Academic eligibility</h3><List items={country.admission.academic} /></div>
          <div><h3>English and language tests</h3><List items={country.admission.language} /></div>
        </div>
        <div className="destination-two-col">
          <div><h3>Common documents</h3><List items={country.admission.documents} className="is-checks" /></div>
          <div><h3>Typical timeline</h3><ol className="destination-steps">{country.admission.timeline.map((item) => <li key={item}>{item}</li>)}</ol></div>
        </div>
        <p className="destination-note">{country.admission.note}</p>
      </DetailSection>

      <DetailSection id="visa" letter="D" title={`Student visa: ${country.visa.name}`}>
        <p className="destination-lead">{country.visa.overview}</p>
        <h3>Key requirements</h3>
        <dl className="destination-requirements">{country.visa.requirements.map((item) => <div key={item.label}><dt>{item.label} <ClaimBadge type={item.type} /></dt><dd>{item.text}</dd></div>)}</dl>
        <aside className="destination-callout is-neutral"><h3>Processing times and decisions</h3><p>{country.visa.processing}</p><p>Processing times change and every decision is made by the immigration authority. VN Group cannot guarantee a visa outcome.</p></aside>
      </DetailSection>

      <DetailSection id="fit" letter="E" title={`Is ${country.name} right for you?`}>
        <p className="destination-lead">No country is best for everyone. Weigh these trade-offs against your subject, budget, language skills and career goals.</p>
        <h3>May suit</h3><List items={country.fit.suits} className="is-checks" />
        <div className="destination-two-col destination-pros-cons">
          <div className="is-pros"><h3>Strengths</h3><List items={country.fit.pros} /></div>
          <div className="is-cons"><h3>Trade-offs</h3><List items={country.fit.cons} /></div>
        </div>
      </DetailSection>

      <DetailSection id="sources" letter="F" title="Sources and checks">
        {country.verify.length > 0 && <aside className="destination-callout is-verify"><div className="destination-table-head"><h3>Check before you apply</h3><ClaimBadge type="verify" /></div><p>These points were changing, disputed or not confirmed on an official page when we last checked:</p><List items={country.verify} /></aside>}
        <details className="destination-sources" open>
          <summary>Official sources for this page ({country.sources.length})</summary>
          <p>Checked {researchDate}.</p>
          <ul>{country.sources.map((item) => <li key={item.url}><ExternalLink href={item.url}>{item.label}</ExternalLink></li>)}</ul>
        </details>
      </DetailSection>

      <DetailSection id="full-guide" letter="G" title={`Full ${country.name} guide`}>
        <VerifiedGuide slug={country.slug} name={country.name} omit={publicGuideParts} />
      </DetailSection>

      <nav className="destination-pager" aria-label="Other destinations">
        <Link to={destinationPath(previous)}><small>Previous</small>{previous.name}</Link>
        <Link to="/destinations" className="is-all">All destinations</Link>
        <Link to={destinationPath(next)}><small>Next</small>{next.name}</Link>
      </nav>
    </div>
  </div>
}
