import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { getDestinationGuide, getDestinationPreviews } from '../api/destinations'
import { useAuth } from '../auth'
import { Btn, Card, EmptyState, Err, Icon, PageHeader } from '../ui'
import CountryFlag from '../components/CountryFlag'
import ListSkeleton from '../components/ui/ListSkeleton'
import { destinationBySlug } from '../data/destinations/registry'
import { formatLocal } from '../data/destinations/meta'

// Checklists built from the account-only guides served by GET /destinations/{slug} (app/data/destinations).
// Guide values still marked "TODO" are unverified and are never shown.

const DISCLAIMER = 'Informational only; visa decisions belong to immigration authorities.'
// Mirrors GUIDE_READERS in app/api/destinations.py; the API enforces it.
export const GUIDE_READER_ROLES = ['student', 'consultancy_staff']
const PENDING = 'Details being verified'

const known = (value) => value !== undefined && value !== null && value !== '' && value !== 'TODO'
const knownList = (items = []) => items.filter(known)
const safeUrl = (url) => known(url) && /^https:\/\//i.test(url)
const knownLinks = (items = []) => items.filter((item) => known(item.label) && safeUrl(item.url))
const dateLabel = (value) => known(value) ? new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : null

const FIGURE_LABELS = {
  official: { label: 'Official figure', tone: 'official' },
  estimate: { label: 'Estimate', tone: 'estimate' },
  'institution-specific': { label: 'Varies by institution', tone: 'estimate' },
}
function FigureBadge({ label }) {
  const figure = FIGURE_LABELS[label]
  return figure ? <span className={`claim-badge is-${figure.tone}`}>{figure.label}</span> : null
}

// Approximate NPR in lakh/crore, the way families in Nepal usually discuss budgets.
const nprLabel = (value) => {
  if (value >= 1e7) return `NPR ${(value / 1e7).toFixed(2).replace(/\.?0+$/, '')} crore`
  if (value >= 1e5) return `NPR ${(value / 1e5).toFixed(1).replace(/\.0$/, '')} lakh`
  return `NPR ${Math.round(value).toLocaleString('en-IN')}`
}

function Money({ figure, currency, conversion }) {
  if (!figure || !known(figure.min) || !known(figure.max)) return null
  const local = figure.min === figure.max ? formatLocal(figure.min, currency) : `${formatLocal(figure.min, currency)} – ${formatLocal(figure.max, currency)}`
  const rate = known(conversion?.rate) ? conversion.rate : null
  const npr = rate && (figure.min === figure.max ? `≈ ${nprLabel(figure.min * rate)}` : `≈ ${nprLabel(figure.min * rate)} – ${nprLabel(figure.max * rate).replace(/^NPR /, '')}`)
  return <p className="visa-figure"><strong>{local}</strong>{npr && <span> {npr}</span>} <FigureBadge label={figure.label} /></p>
}

function ExternalLink({ href, children }) {
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}<span className="sr-only"> (opens in a new tab)</span><svg className="external-icon" aria-hidden="true" viewBox="0 0 16 16"><path d="M6 3H3v10h10v-3M9 2h5v5M14 2 7 9"/></svg></a>
}

function Notice({ verified }) {
  return (
    <div className="ui-alert ui-alert--info visa-notice" role="note">
      <Icon name="approve" />
      <span><strong>{DISCLAIMER}</strong> {verified ? `Last verified ${verified}.` : 'This guide has not been verified yet.'} Requirements change, so check each item against the official links before you apply.</span>
    </div>
  )
}

function NotForRole() {
  return (
    <Card>
      <EmptyState icon="lock" title="Visa checklists are for student accounts">
        Ask the student you support to open this page from their own account, or message VN Group with your question.
      </EmptyState>
    </Card>
  )
}

function Pending({ children = PENDING }) {
  return <p className="visa-pending">{children}</p>
}

export function VisaHub() {
  const { user } = useAuth()
  const [previews, setPreviews] = useState(null)
  const [err, setErr] = useState('')
  const load = () => { setErr(''); getDestinationPreviews().then(setPreviews).catch((e) => setErr(e.message)) }
  useEffect(load, [])

  const header = <PageHeader eyebrow="Visa preparation" title="Visa checklists" description="Choose a destination to see its document checklist, financial preparation and official links." />
  if (!GUIDE_READER_ROLES.includes(user.role)) return <div className="ui-stack">{header}<NotForRole /></div>

  return (
    <div className="ui-stack">
      {header}
      <Notice />
      <Err msg={err} onRetry={load} />
      {!previews && !err && <ListSkeleton label="Loading destinations" />}
      {previews && (
        <Card>
          <ul className="visa-countries">
            {previews.map((item) => {
              const verified = dateLabel(item.lastVerified)
              return (
                <li key={item.slug}>
                  <Link to={`/visa/${item.slug}`} className="visa-country">
                    <CountryFlag code={destinationBySlug(item.slug)?.code} size={22} />
                    <span className="visa-country-text">
                      <span className="visa-country-name">{item.name}</span>
                      <span className="visa-country-visa">{known(item.summary) ? item.summary : 'Student visa checklist'}</span>
                    </span>
                    <span className="visa-country-count">{verified ? `Verified ${verified}` : 'Being verified'}</span>
                    <Icon name="chevronRight" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}

// Ticks live only in this browser, keyed by user and country.
function useTicks(userId, slug) {
  const key = `vn-visa-checklist:${userId}:${slug}`
  const [ticks, setTicks] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(key)) || []) } catch { return new Set() }
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify([...ticks])) } catch { /* storage unavailable: ticks last for this visit */ }
  }, [key, ticks])
  const toggle = (item) => setTicks((current) => {
    const next = new Set(current)
    next.has(item) ? next.delete(item) : next.add(item)
    return next
  })
  return [ticks, toggle, () => setTicks(new Set())]
}

function Section({ title, aside, children }) {
  return (
    <Card>
      <div className="ui-section-head">
        <h2 className="ui-section-title">{title}</h2>
        {aside}
      </div>
      <div className="visa-section-body">{children}</div>
    </Card>
  )
}

function DocumentChecklist({ guide }) {
  const { user } = useAuth()
  const items = knownList(guide.studentVisa.documents)
  const [ticks, toggle, reset] = useTicks(user.id, guide.slug)
  const done = items.filter((item) => ticks.has(item)).length
  if (items.length === 0) return <Section title="Documents"><Pending>The document list for this visa is being verified. Your counsellor can tell you what to prepare in the meantime.</Pending></Section>
  return (
    <Section title="Documents" aside={<span className="ui-count" aria-live="polite"><strong>{done}</strong> of {items.length} ready</span>}>
      <ul className="visa-checklist">
        {items.map((item) => (
          <li key={item}>
            <label className="visa-check">
              <input type="checkbox" checked={ticks.has(item)} onChange={() => toggle(item)} />
              <span>{item}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className="visa-checklist-foot">
        <p>Ticks are saved in this browser only and are not shared with VN Group. To have documents reviewed, upload them in <Link to="/portal">Documents</Link>.</p>
        {done > 0 && <Btn type="button" variant="ghost" size="sm" onClick={reset}>Clear ticks</Btn>}
      </div>
    </Section>
  )
}

function FinancialPreparation({ guide }) {
  const { financialEvidence, insurance } = guide.studentVisa
  const blocks = [
    { title: 'Funds to show for the visa', text: financialEvidence.requirement, figure: financialEvidence.amount },
    { title: 'Health insurance', text: insurance.requirement, figure: insurance.annualCost, suffix: 'per year' },
  ].filter((block) => known(block.text) || (known(block.figure.min) && known(block.figure.max)))
  const rateDate = dateLabel(guide.nprConversion.date)
  return (
    <Section title="Financial preparation">
      {blocks.length === 0 ? <Pending>Funding and insurance requirements for this visa are being verified.</Pending> : <>
        <div className="visa-finance">
          {blocks.map((block) => (
            <div key={block.title}>
              <h3 className="visa-subhead">{block.title}{block.suffix && <span className="visa-muted"> ({block.suffix})</span>}</h3>
              {known(block.text) && <p>{block.text}</p>}
              <Money figure={block.figure} currency={guide.currency} conversion={guide.nprConversion} />
            </div>
          ))}
        </div>
        {known(guide.nprConversion.rate) && <p className="visa-muted">NPR amounts are approximate, at {guide.nprConversion.rate} NPR per {guide.currency}{rateDate ? ` (${rateDate})` : ''}. Your bank’s rate and fees will differ.</p>}
      </>}
    </Section>
  )
}

function OfficialLinks({ guide }) {
  const links = knownLinks(guide.officialLinks)
  const sources = knownLinks(guide.sources)
  return (
    <Section title="Official links">
      {links.length === 0 ? <Pending>Official links for this visa are being verified.</Pending> : (
        <ul className="visa-links">{links.map((item) => <li key={item.url}><ExternalLink href={item.url}>{item.label}</ExternalLink></li>)}</ul>
      )}
      {sources.length > 0 && <>
        <h3 className="visa-subhead">Sources</h3>
        <ul className="visa-links">
          {sources.map((item) => <li key={item.url}><ExternalLink href={item.url}>{item.label}</ExternalLink>{dateLabel(item.accessed) && <span className="visa-muted">Accessed {dateLabel(item.accessed)}</span>}</li>)}
        </ul>
      </>}
    </Section>
  )
}

export function VisaChecklist() {
  const { slug } = useParams()
  const { user } = useAuth()
  const allowed = GUIDE_READER_ROLES.includes(user.role)
  const [guide, setGuide] = useState(null)
  const [error, setError] = useState(null)
  const load = () => {
    setError(null)
    getDestinationGuide(slug).then(setGuide).catch(setError)
  }
  useEffect(() => { setGuide(null); if (allowed) load() }, [slug, allowed])
  useEffect(() => { if (guide) document.title = `${guide.name} visa checklist | VN Group` }, [guide])

  const back = <Link to="/visa" className="visa-back"><Icon name="chevronLeft" />All destinations</Link>
  if (!allowed || error?.status === 403) return <div className="ui-stack visa-page">{back}<NotForRole /></div>
  if (error?.status === 404) return <Navigate to="/visa" replace />
  if (error) return <div className="ui-stack visa-page">{back}<Err msg={error.message} onRetry={load} /></div>
  if (!guide) return <div className="ui-stack visa-page">{back}<ListSkeleton label="Loading visa checklist" /></div>

  const visa = guide.studentVisa
  const steps = knownList(visa.process)
  const processing = visa.processingEstimate

  return (
    <div className="ui-stack visa-page">
      {back}
      <PageHeader
        eyebrow={<><CountryFlag code={destinationBySlug(guide.slug)?.code} size={14} />{guide.name}</>}
        title={known(visa.category) ? visa.category : `${guide.name} student visa`}
        description={known(guide.overview.summary) ? guide.overview.summary : undefined}
        actions={<>
          <Btn type="button" variant="secondary" size="sm" onClick={() => window.print()}>Print</Btn>
          <Link to={`/destinations/${guide.slug}`} className="ui-btn ui-btn--ghost ui-btn--sm">Public {guide.name} guide</Link>
        </>}
      />
      <Notice verified={dateLabel(guide.lastVerified)} />

      <DocumentChecklist guide={guide} />
      <FinancialPreparation guide={guide} />

      <Section title="Application steps">
        {steps.length === 0 ? <Pending>The application steps for this visa are being verified.</Pending> : (
          <ol className="visa-steps">{steps.map((step) => <li key={step}>{step}</li>)}</ol>
        )}
        {known(processing.value) && <p className="visa-muted">Processing estimate: {processing.value} <FigureBadge label={processing.label} /></p>}
      </Section>

      <OfficialLinks guide={guide} />

      <Card className="visa-help">
        <p>{DISCLAIMER} VN Group cannot guarantee a visa outcome. If something here is unclear for your case, ask your counsellor.</p>
        {user.role !== 'consultancy_staff' && <Link to="/messages" className="ui-btn ui-btn--primary ui-btn--sm"><Icon name="messages" />Message VN Group</Link>}
      </Card>
    </div>
  )
}
