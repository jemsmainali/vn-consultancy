import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth'
import { getDestinationGuide } from '../../api/destinations'
import { claimTypes, formatLocal, formatNprValue } from '../../data/destinations/meta'

// Guide files use "TODO" for anything not yet researched; those values are never shown.
const TODO = 'TODO'
const known = (value) => value != null && value !== '' && value !== TODO
const hasContent = (value) => Array.isArray(value)
  ? value.some(hasContent)
  : value && typeof value === 'object'
    ? Object.entries(value).some(([key, item]) => key !== 'label' && hasContent(item))
    : known(value)
const verified = (items) => (items || []).filter(hasContent)

function Pending() {
  return <p className="guide-pending">Details being verified</p>
}

function Label({ figure }) {
  const claim = known(figure?.label) && claimTypes[figure.label]
  return claim ? <span className={`claim-badge is-${figure.label}`} title={claim.detail}>{claim.label}</span> : null
}

function Fact({ figure }) {
  return known(figure?.value) ? <>{figure.value} <Label figure={figure} /></> : <Pending />
}

function Money({ figure, currency, rate }) {
  if (!known(figure?.min) || !known(figure?.max)) return <Pending />
  const { min, max } = figure
  const local = min === max ? formatLocal(min, currency) : `${formatLocal(min, currency)} – ${formatLocal(max, currency)}`
  const npr = known(rate) && (min === max ? formatNprValue(min * rate) : `${formatNprValue(min * rate)} – ${formatNprValue(max * rate).replace(/^NPR /, '')}`)
  return <>{local}{npr && <small> ≈ {npr}</small>} <Label figure={figure} /></>
}

function Section({ title, show, children }) {
  return <div className="guide-block"><h3>{title}</h3>{show ? children : <Pending />}</div>
}

function TextList({ items, ordered }) {
  const rows = verified(items)
  if (!rows.length) return <Pending />
  const Tag = ordered ? 'ol' : 'ul'
  return <Tag className={ordered ? 'destination-steps' : 'destination-list'}>{rows.map((item) => <li key={item}>{item}</li>)}</Tag>
}

function Field({ term, children }) {
  return <div><dt>{term}</dt><dd>{children}</dd></div>
}

const livingRows = [['accommodation', 'Accommodation'], ['food', 'Food'], ['transport', 'Transport'], ['utilities', 'Utilities'], ['personal', 'Personal']]

function GuideBody({ guide, omit }) {
  const shows = (part) => !omit.includes(part)
  const { currency } = guide
  const rate = guide.nprConversion?.rate
  const money = (figure) => <Money figure={figure} currency={currency} rate={rate} />
  const visa = guide.studentVisa

  return <div className="verified-guide">
    {shows('overview') && <Section title="Overview and education system" show={hasContent(guide.overview)}>
      {known(guide.overview.summary) && <p className="destination-lead">{guide.overview.summary}</p>}
      {known(guide.overview.educationSystem) ? <p>{guide.overview.educationSystem}</p> : <Pending />}
    </Section>}

    <Section title="Courses and levels" show={verified(guide.courses).length > 0}>
      <dl className="destination-requirements">{verified(guide.courses).map((item) => <Field key={item.level} term={known(item.level) ? item.level : 'Level'}>
        <Fact figure={item.typicalDuration} />{known(item.description) && <p>{item.description}</p>}
      </Field>)}</dl>
    </Section>

    <Section title="Universities and timelines" show={hasContent(guide.universities)}>
      {verified(guide.universities.institutions).length > 0 && <ul className="destination-list">{verified(guide.universities.institutions).map((item) => <li key={item.name}>
        {known(item.url) ? <a href={item.url} target="_blank" rel="noopener noreferrer">{item.name}</a> : item.name}{known(item.city) && ` · ${item.city}`}
      </li>)}</ul>}
      <h4>Intakes</h4><TextList items={guide.universities.intakes} />
      {shows('applicationTimeline') && <><h4>Application timeline</h4><TextList items={guide.universities.applicationTimeline} ordered /></>}
    </Section>

    {shows('tuition') && <Section title={`Tuition per year (${currency})`} show={verified(guide.tuition).length > 0}>
      <dl className="destination-requirements">{verified(guide.tuition).map((item) => <Field key={item.level} term={item.level}>{money(item.annualFee)}</Field>)}</dl>
    </Section>}

    {shows('livingCosts') && <Section title={`Monthly living costs by city (${currency})`} show={verified(guide.livingCosts).length > 0}>
      {verified(guide.livingCosts).map((city) => <div key={city.city}>
        <h4>{known(city.city) ? city.city : 'City'}</h4>
        <dl className="destination-requirements">{livingRows.map(([key, label]) => <Field key={key} term={label}>{money(city[key])}</Field>)}</dl>
      </div>)}
    </Section>}

    <Section title="Scholarships" show={verified(guide.scholarships).length > 0}>
      <dl className="destination-requirements">{verified(guide.scholarships).map((item) => <Field key={item.name} term={known(item.url) ? <a href={item.url} target="_blank" rel="noopener noreferrer">{item.name}</a> : item.name}>
        {known(item.provider) && <>{item.provider}. </>}<Fact figure={item.coverage} />
        {known(item.eligibility) && <p>Eligibility: {item.eligibility}</p>}
        {known(item.deadline) && <p>Deadline: {item.deadline}</p>}
      </Field>)}</dl>
    </Section>

    <Section title="Student visa" show={hasContent(visa)}>
      <dl className="destination-requirements">
        <Field term="Category">{known(visa.category) ? visa.category : <Pending />}</Field>
        {shows('financialEvidence') && <Field term="Financial evidence">{known(visa.financialEvidence.requirement) && <p>{visa.financialEvidence.requirement}</p>}{money(visa.financialEvidence.amount)}</Field>}
        <Field term="Health insurance">{known(visa.insurance.requirement) && <p>{visa.insurance.requirement}</p>}{hasContent(visa.insurance.annualCost) && money(visa.insurance.annualCost)}</Field>
        <Field term="Published processing estimate"><Fact figure={visa.processingEstimate} /></Field>
      </dl>
      <h4>Process</h4><TextList items={visa.process} ordered />
      <h4>Documents</h4><TextList items={visa.documents} />
    </Section>

    <Section title="Working while you study" show={hasContent(guide.workRules)}>
      <dl className="destination-requirements">
        <Field term="During term"><Fact figure={guide.workRules.duringTerm} /></Field>
        <Field term="During breaks"><Fact figure={guide.workRules.duringBreaks} /></Field>
      </dl>
      <TextList items={guide.workRules.conditions} />
    </Section>

    <Section title="Post-study routes" show={verified(guide.postStudyRoutes).length > 0}>
      <dl className="destination-requirements">{verified(guide.postStudyRoutes).map((item) => <Field key={item.name} term={item.name}>
        <Fact figure={item.duration} />{known(item.conditions) && <p>{item.conditions}</p>}
      </Field>)}</dl>
    </Section>

    <Section title="Lifestyle" show={verified(guide.lifestyle).length > 0}>
      <dl className="destination-lifestyle">{verified(guide.lifestyle).map((item) => <Field key={item.topic} term={item.topic}>{known(item.text) ? item.text : <Pending />}</Field>)}</dl>
    </Section>

    <Section title="Official links and sources" show={verified(guide.officialLinks).length + verified(guide.sources).length > 0}>
      <ul className="destination-resource-list">{[...verified(guide.officialLinks), ...verified(guide.sources)].filter((item) => known(item.url)).map((item) => <li key={item.url}>
        <a href={item.url} target="_blank" rel="noopener noreferrer">{known(item.label) ? item.label : item.url}</a>
      </li>)}</ul>
    </Section>

    <p className="destination-table-note">
      {known(guide.lastVerified) ? `Last verified ${guide.lastVerified}.` : 'Verification date pending.'}
      {known(rate) && known(guide.nprConversion.date) && ` NPR amounts use 1 ${currency} = NPR ${rate} (${guide.nprConversion.date}); your bank’s rate will differ.`}
    </p>
  </div>
}

// `omit` lists guide parts the surrounding page already shows publicly.
export default function VerifiedGuide({ slug, name, omit = [] }) {
  const { user, loading } = useAuth()
  const [state, setState] = useState({ status: 'idle' })

  useEffect(() => {
    if (!user) return undefined
    let active = true
    setState({ status: 'loading' })
    getDestinationGuide(slug)
      .then((guide) => active && setState({ status: 'ready', guide }))
      .catch((error) => active && setState({ status: 'error', code: error.status }))
    return () => { active = false }
  }, [slug, user])

  if (loading) return null
  if (!user) return <aside className="destination-callout guide-gate">
    <h3>Sign in to read the full {name} guide</h3>
    <p>Scholarships, visa steps and documents, work rules, post-study routes, student life and the full list of official links are available to VN Group student accounts.</p>
    <p><Link to="/login">Sign in</Link> or <Link to="/register">create a free account</Link>.</p>
  </aside>
  if (state.status === 'error') return <aside className="destination-callout guide-gate">
    <p>{state.code === 403 ? 'Full guides are available to student accounts.' : 'We couldn’t load the full guide. Please try again later.'}</p>
  </aside>
  if (state.status !== 'ready') return <p className="guide-pending" role="status">Loading the full guide…</p>
  if (!hasContent({ ...state.guide, slug: null, name: null, currency: null })) return <aside className="destination-callout guide-gate">
    <h3>Details being verified</h3>
    <p>Our team is checking every figure in this guide against official sources. Until then, use the summary above and confirm details with the official links.</p>
  </aside>
  return <GuideBody guide={state.guide} omit={omit} />
}
