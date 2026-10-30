import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Input, Select, Btn, Err, Field, PageHeader, EmptyState } from '../ui'
import ListSkeleton from '../components/ui/ListSkeleton'
import CountryFlag from '../components/CountryFlag'
import { destinations } from '../data/destinations/registry'
import { fetchDirectory, fetchStudyPlan, updateStudyPlan, removeSavedItem, resolveRef, LEVEL_LABEL } from '../api/studyPlan'

const toForm = (plan) => ({
  preferred_countries: plan.preferred_countries,
  study_level: plan.preferences.study_level || '',
  fields_of_study: plan.preferences.fields_of_study.join(', '),
  intake: plan.preferences.intake || '',
  notes: plan.preferences.notes || '',
})

function SavedItem({ item, universities, busy, onRemove }) {
  const entry = resolveRef(universities, item.kind, item.ref)
  const country = entry && destinations.find((d) => d.slug === entry.university.country)
  return <li className="sp-saved">
    <div className="sp-saved-main">
      {entry ? <>
        <p className="sp-saved-name">{entry.course ? entry.course.name : entry.university.name}</p>
        <p className="sp-saved-meta">
          {entry.course && <>{LEVEL_LABEL[entry.course.level]} · {entry.university.name} · </>}
          {entry.university.city}, {country?.name || entry.university.country}
        </p>
      </> : <>
        <p className="sp-saved-name">{item.ref}</p>
        <p className="sp-saved-meta">No longer listed in the directory</p>
      </>}
    </div>
    <Btn type="button" size="sm" variant="ghost" onClick={onRemove} disabled={busy}>{busy ? 'Removing…' : 'Remove'}</Btn>
  </li>
}

export default function StudyPlan() {
  const [plan, setPlan] = useState(null)
  const [universities, setUniversities] = useState([])
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [err, setErr] = useState('')

  const load = () => {
    setErr('')
    return Promise.all([fetchStudyPlan(), fetchDirectory()])
      .then(([nextPlan, directory]) => { setPlan(nextPlan); setForm(toForm(nextPlan)); setUniversities(directory.universities) })
      .catch((e) => setErr(e.message))
  }
  useEffect(() => { load() }, [])

  const set = (name) => (event) => { setSavedAt(null); setForm((current) => ({ ...current, [name]: event.target.value })) }
  const toggleCountry = (slug) => {
    setSavedAt(null)
    setForm((current) => ({
      ...current,
      preferred_countries: current.preferred_countries.includes(slug)
        ? current.preferred_countries.filter((item) => item !== slug)
        : [...current.preferred_countries, slug],
    }))
  }

  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setErr('')
    try {
      const next = await updateStudyPlan({
        preferred_countries: form.preferred_countries,
        preferences: {
          study_level: form.study_level || null,
          fields_of_study: form.fields_of_study.split(',').map((item) => item.trim()).filter(Boolean),
          intake: form.intake.trim() || null,
          notes: form.notes.trim() || null,
        },
      })
      setPlan(next); setForm(toForm(next)); setSavedAt(Date.now())
    } catch (e) { setErr(e.message) }
    setSaving(false)
  }

  const remove = async (id) => {
    setBusyId(id); setErr('')
    try {
      await removeSavedItem(id)
      setPlan((current) => ({ ...current, saved_items: current.saved_items.filter((item) => item.id !== id) }))
    } catch (e) { setErr(e.message) }
    setBusyId(null)
  }

  return <div className="ui-stack">
    <PageHeader
      eyebrow="Your workspace"
      title="My study plan"
      description="Note where and what you would like to study, and keep a shortlist of universities and courses to discuss with your counsellor."
    />
    <Err msg={err} onRetry={plan === null ? load : undefined} />
    {plan === null && !err && <ListSkeleton label="Loading your study plan" />}

    {form && <Card>
      <div className="ui-section-head"><div>
        <h2 className="ui-section-title">Preferences</h2>
        <p className="ui-section-text">Saved privately to your account.</p>
      </div></div>
      <form onSubmit={submit} className="sp-form">
        <fieldset className="sp-countries">
          <legend className="ui-label">Preferred countries</legend>
          <div className="sp-country-grid">
            {destinations.map((item) => <label key={item.slug} className={`sp-country${form.preferred_countries.includes(item.slug) ? ' is-selected' : ''}`}>
              <input type="checkbox" className="sr-only" checked={form.preferred_countries.includes(item.slug)} onChange={() => toggleCountry(item.slug)} />
              <CountryFlag code={item.code} size={16} />{item.name}
            </label>)}
          </div>
        </fieldset>
        <Field label="Study level">
          <Select value={form.study_level} onChange={set('study_level')}>
            <option value="">Not decided yet</option>
            {Object.entries(LEVEL_LABEL).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
          </Select>
        </Field>
        <Field label="Preferred intake" hint="For example, February 2027">
          <Input value={form.intake} onChange={set('intake')} maxLength={40} />
        </Field>
        <Field label="Fields of study" hint="Up to five, separated by commas" className="sp-span">
          <Input value={form.fields_of_study} onChange={set('fields_of_study')} placeholder="e.g. Nursing, Data science" />
        </Field>
        <Field label="Notes for your counsellor" className="sp-span">
          <textarea className="ui-input sp-notes" value={form.notes} onChange={set('notes')} maxLength={500} rows={3} />
        </Field>
        <div className="sp-form-footer sp-span">
          <span className="sp-saved-note" role="status">{savedAt ? 'Preferences saved.' : ''}</span>
          <Btn disabled={saving}>{saving ? <><span className="ui-spin" aria-hidden="true" />Saving…</> : 'Save preferences'}</Btn>
        </div>
      </form>
    </Card>}

    {plan && <Card>
      <div className="ui-section-head"><div>
        <h2 className="ui-section-title">Saved universities and courses</h2>
        <p className="ui-section-text">Add items from the <Link to="/universities">university directory</Link>.</p>
      </div></div>
      {plan.saved_items.length === 0
        ? <EmptyState icon="search" title="Nothing saved yet">Saved universities and courses will appear here.</EmptyState>
        : <ul className="sp-saved-list">
          {plan.saved_items.map((item) => <SavedItem key={item.id} item={item} universities={universities} busy={busyId === item.id} onRemove={() => remove(item.id)} />)}
        </ul>}
    </Card>}
  </div>
}
