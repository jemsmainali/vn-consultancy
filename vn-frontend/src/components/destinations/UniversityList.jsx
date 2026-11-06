import { useEffect, useMemo, useState } from 'react'
import { formatMonthYear } from '../../data/siteContent'

// One JSON file per destination, built from official registers (see each file's `sources`).
// Loaded only when the destination page is opened; a country without a file shows nothing.
const listFiles = import.meta.glob('../../data/destinations/universities/*.json', { import: 'default' })
const fileFor = (slug) => listFiles[`../../data/destinations/universities/${slug}.json`]
export const hasUniversityList = (slug) => Boolean(fileFor(slug))

const PAGE_SIZE = 25
const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const formatDate = (value) => (/^\d{4}-\d{2}-\d{2}$/.test(value) ? dateFormat.format(new Date(`${value}T00:00:00Z`)) : formatMonthYear(value))
const unique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b))
const normalise = (value) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function Select({ label, value, onChange, options, allLabel }) {
  if (options.length < 2) return null
  return <label className="uni-filter">
    <span>{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{allLabel}</option>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  </label>
}

export default function UniversityList({ slug, countryName }) {
  const [data, setData] = useState(null)
  const [failed, setFailed] = useState(false)
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('')
  const [level, setLevel] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const load = fileFor(slug)
    if (!load) return undefined
    let active = true
    setData(null)
    load().then((value) => { if (active) setData(value) }).catch(() => { if (active) setFailed(true) })
    return () => { active = false }
  }, [slug])

  const rows = data?.universities || []
  const options = useMemo(() => ({
    regions: unique(rows.flatMap((row) => row.regions)),
    levels: unique(rows.flatMap((row) => row.levels)),
    types: unique(rows.map((row) => row.type)),
  }), [rows])

  const filtered = useMemo(() => {
    const words = normalise(query.trim()).split(/\s+/).filter(Boolean)
    return rows.filter((row) => {
      if (region && !row.regions.includes(region)) return false
      if (level && !row.levels.includes(level)) return false
      if (type && row.type !== type) return false
      if (!words.length) return true
      const haystack = normalise(`${row.name} ${row.place} ${row.regions.join(' ')}`)
      return words.every((word) => haystack.includes(word))
    })
  }, [rows, query, region, level, type])

  useEffect(() => { setPage(1) }, [query, region, level, type, slug])

  if (!fileFor(slug) || failed) return null
  if (!data) return <p className="uni-loading" role="status">Loading the list of universities…</p>
  if (!rows.length) return null

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const filtering = Boolean(query || region || level || type)
  const reset = () => { setQuery(''); setRegion(''); setLevel(''); setType('') }

  return <div className="uni-list">
    <p className="uni-count"><strong>{rows.length.toLocaleString('en-GB')}</strong> institutions{data.scope && <> · {data.scope}</>}</p>
    <p className="uni-disclaimer">Listing a university does not mean it is a VN Group partner. Always confirm details on the university's official website.</p>

    <div className="uni-controls" role="search" aria-label={`Search universities in ${countryName}`}>
      <label className="uni-search">
        <span>Search</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="University name or city" autoComplete="off" />
      </label>
      <Select label={data.regionLabel || 'Location'} value={region} onChange={setRegion} options={options.regions} allLabel="All" />
      <Select label="Level" value={level} onChange={setLevel} options={options.levels} allLabel="All levels" />
      <Select label="Type" value={type} onChange={setType} options={options.types} allLabel="All types" />
    </div>

    <p className="uni-results" aria-live="polite">
      {filtered.length === rows.length ? `Showing all ${rows.length.toLocaleString('en-GB')}, A to Z` : `${filtered.length.toLocaleString('en-GB')} of ${rows.length.toLocaleString('en-GB')} match`}
      {filtering && <button type="button" className="uni-reset" onClick={reset}>Clear filters</button>}
    </p>

    {shown.length > 0 ? <ul className="uni-rows">
      {shown.map((row) => <li key={`${row.name}-${row.place}`} className="uni-row">
        <div className="uni-row-main">
          {row.website
            ? <a href={row.website} target="_blank" rel="noopener noreferrer" className="uni-name">{row.name}<span className="sr-only"> (official website, opens in a new tab)</span></a>
            : <span className="uni-name">{row.name}</span>}
          {row.vnGroupPartner && <span className="uni-partner">VN Group partner</span>}
        </div>
        <p className="uni-meta">
          {[row.place || row.regions.join(', '), row.type, row.levels.join(', ')].filter(Boolean).join(' · ')}
        </p>
      </li>)}
    </ul> : <p className="uni-empty">No institutions match. Try a different name or clear the filters.</p>}

    {pages > 1 && <nav className="uni-pager" aria-label="University list pages">
      <button type="button" onClick={() => setPage(current - 1)} disabled={current === 1}>Previous</button>
      <span>Page {current} of {pages}</span>
      <button type="button" onClick={() => setPage(current + 1)} disabled={current === pages}>Next</button>
    </nav>}

    <p className="uni-source">
      Last verified {formatDate(data.lastVerified)}. Source: {data.sources.map((source, index) => <span key={source.url}>{index > 0 && '; '}<a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}<span className="sr-only"> (opens in a new tab)</span></a></span>)}.
    </p>
  </div>
}
