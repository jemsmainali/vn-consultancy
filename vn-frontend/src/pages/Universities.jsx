import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Input, Select, Btn, Err, Field, Icon, PageHeader, StatusBadge, EmptyState } from '../ui'
import ListSkeleton from '../components/ui/ListSkeleton'
import CountryFlag from '../components/CountryFlag'
import { destinations } from '../data/destinations/registry'
import { fetchDirectory, fetchStudyPlan, saveItem, removeSavedItem, LEVEL_LABEL, formatDate, courseRef } from '../api/studyPlan'

const countryOf = (slug) => destinations.find((item) => item.slug === slug)

function Source({ fact }) {
  return <span className="sp-source">
    Checked {formatDate(fact.checked_on)} · <a href={fact.source_url} target="_blank" rel="noopener noreferrer">Official source<span className="sr-only"> (opens in a new tab)</span></a>
  </span>
}

function SaveButton({ saved, busy, onToggle, label }) {
  return <Btn type="button" size="sm" variant={saved ? 'secondary' : 'ghost'} onClick={onToggle} disabled={busy} aria-pressed={saved} aria-label={`${saved ? 'Remove' : 'Save'} ${label} ${saved ? 'from' : 'to'} my plan`}>
    {busy ? <span className="ui-spin" aria-hidden="true" /> : saved && <Icon name="check" />}
    {saved ? 'Saved' : 'Save to plan'}
  </Btn>
}

function UniversityCard({ university, savedByRef, busyRef, onToggle }) {
  const country = countryOf(university.country)
  const toggle = (kind, ref) => onToggle(kind, ref)

  return <Card className="sp-uni">
    <div className="sp-uni-head">
      <div className="sp-uni-title">
        <h2 className="ui-section-title">{university.name}</h2>
        <p className="sp-uni-place">
          <CountryFlag code={country?.code} size={16} />
          {university.city}, {country?.name || university.country}
        </p>
      </div>
      <div className="sp-uni-actions">
        {university.vn_partner_verified && <StatusBadge tone="gold">VN Group partner</StatusBadge>}
        <SaveButton saved={Boolean(savedByRef[`university:${university.id}`])} busy={busyRef === `university:${university.id}`} onToggle={() => toggle('university', university.id)} label={university.name} />
      </div>
    </div>

    <dl className="sp-facts">
      <div><dt>Study levels</dt><dd>{university.levels.map((level) => LEVEL_LABEL[level]).join(', ')}</dd></div>
      <div><dt>Admission requirements</dt><dd>{university.admission_requirements ? <>{university.admission_requirements.text} <Source fact={university.admission_requirements} /></> : 'See the official website.'}</dd></div>
      <div><dt>English requirements</dt><dd>{university.english_requirements ? <>{university.english_requirements.text} <Source fact={university.english_requirements} /></> : 'See the official website.'}</dd></div>
    </dl>

    {university.courses.length > 0 && <div className="sp-courses">
      <h3 className="sp-courses-title">Courses</h3>
      <ul>
        {university.courses.map((course) => {
          const ref = courseRef(university, course)
          return <li key={course.id} className="sp-course">
            <div className="sp-course-main">
              <a href={course.official_url} target="_blank" rel="noopener noreferrer" className="sp-course-name">{course.name}<span className="sr-only"> (opens in a new tab)</span></a>
              <span className="sp-course-level">{LEVEL_LABEL[course.level]}</span>
              {course.tuition && <p className="sp-course-fact">
                Tuition: <strong>{course.tuition.currency} {course.tuition.amount.toLocaleString('en-US')}</strong> per {course.tuition.period} <Source fact={course.tuition} />
              </p>}
              {course.deadlines.map((deadline) => <p key={deadline.intake} className="sp-course-fact">
                {deadline.intake} intake: apply by <strong>{formatDate(deadline.deadline)}</strong> <Source fact={deadline} />
              </p>)}
            </div>
            <SaveButton saved={Boolean(savedByRef[`course:${ref}`])} busy={busyRef === `course:${ref}`} onToggle={() => toggle('course', ref)} label={course.name} />
          </li>
        })}
      </ul>
    </div>}

    <a className="sp-official" href={university.official_url} target="_blank" rel="noopener noreferrer">
      Official website<span className="sr-only"> (opens in a new tab)</span>
    </a>
  </Card>
}

export default function Universities() {
  const [universities, setUniversities] = useState(null)
  const [saved, setSaved] = useState([])
  const [filters, setFilters] = useState({ q: '', country: '', level: '' })
  const [busyRef, setBusyRef] = useState(null)
  const [err, setErr] = useState('')

  const load = () => {
    setErr('')
    return Promise.all([fetchDirectory(), fetchStudyPlan()])
      .then(([directory, plan]) => { setUniversities(directory.universities); setSaved(plan.saved_items) })
      .catch((e) => setErr(e.message))
  }
  useEffect(() => { load() }, [])

  const savedByRef = useMemo(() => Object.fromEntries(saved.map((item) => [`${item.kind}:${item.ref}`, item])), [saved])

  const visible = useMemo(() => {
    const q = filters.q.trim().toLowerCase()
    return (universities || []).filter((university) =>
      (!filters.country || university.country === filters.country)
      && (!filters.level || university.levels.includes(filters.level))
      && (!q || [university.name, university.city, ...university.courses.map((course) => course.name)].some((text) => text.toLowerCase().includes(q))))
  }, [universities, filters])

  const listedCountries = destinations.filter((item) => universities?.some((university) => university.country === item.slug))

  const toggle = async (kind, ref) => {
    const key = `${kind}:${ref}`
    setBusyRef(key); setErr('')
    try {
      if (savedByRef[key]) {
        await removeSavedItem(savedByRef[key].id)
        setSaved((items) => items.filter((item) => item.id !== savedByRef[key].id))
      } else {
        const item = await saveItem(kind, ref)
        setSaved((items) => [item, ...items])
      }
    } catch (e) { setErr(e.message) }
    setBusyRef(null)
  }

  const setFilter = (name) => (event) => setFilters((current) => ({ ...current, [name]: event.target.value }))

  return <div className="ui-stack">
    <PageHeader
      eyebrow="Your workspace"
      title="Universities and courses"
      description="Fees, deadlines and requirements are shown only when we have checked them on the university's official pages. Always confirm on the official site before you apply."
      actions={<Link className="ui-btn ui-btn--secondary" to="/study-plan">My study plan</Link>}
    />
    <Err msg={err} onRetry={universities === null ? load : undefined} />

    {universities === null && !err && <ListSkeleton label="Loading universities" />}

    {universities?.length === 0 && <Card>
      <EmptyState icon="search" title="The directory is being prepared">
        We only list a university after checking its fees, deadlines and requirements against official sources, and none have been added yet. Ask your counsellor in <Link to="/messages">Messages</Link> for options that suit you.
      </EmptyState>
    </Card>}

    {universities?.length > 0 && <>
      <Card className="sp-filters">
        <Field label="Search"><Input type="search" value={filters.q} onChange={setFilter('q')} placeholder="University, city or course" /></Field>
        <Field label="Country">
          <Select value={filters.country} onChange={setFilter('country')}>
            <option value="">All countries</option>
            {listedCountries.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </Select>
        </Field>
        <Field label="Study level">
          <Select value={filters.level} onChange={setFilter('level')}>
            <option value="">All levels</option>
            {Object.entries(LEVEL_LABEL).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
          </Select>
        </Field>
      </Card>
      <p className="sp-result-count" role="status">{visible.length} of {universities.length} universit{universities.length === 1 ? 'y' : 'ies'}</p>
      {visible.length === 0
        ? <Card><EmptyState icon="search" title="No matches">Try a different country, level or search term.</EmptyState></Card>
        : visible.map((university) => <UniversityCard key={university.id} university={university} savedByRef={savedByRef} busyRef={busyRef} onToggle={toggle} />)}
    </>}
  </div>
}
