import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { faqCategories, faqs } from '../../data/faqs'
import SectionHeading from './SectionHeading'

const faqId = (question) => `faq-${question.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
const normalise = (value) => value.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
const categoryLabel = (id) => faqCategories.find((category) => category.id === id)?.label

function Accordion({ items, openItems, toggle, showCategory }) {
  return <div className="faq-data-list">{items.map(({ question, answer, category }) => {
    const id = faqId(question)
    const expanded = openItems.has(id)
    return <article id={id} className={`faq-accordion-item${expanded ? ' is-open' : ''}`} key={id}>
      <h3><button id={`${id}-trigger`} type="button" aria-expanded={expanded} aria-controls={`${id}-panel`} onClick={() => toggle(id)}>
        <span>{showCategory && <small className="faq-category-tag">{categoryLabel(category)}</small>}{question}</span><span className="faq-accordion-icon" aria-hidden="true">{expanded ? '−' : '+'}</span>
      </button></h3>
      <div id={`${id}-panel`} className="faq-accordion-panel" role="region" aria-labelledby={`${id}-trigger`} aria-hidden={!expanded}>
        <div className="faq-accordion-panel-inner"><p>{answer}</p></div>
      </div>
    </article>
  })}</div>
}

// variant="preview" shows featured questions on the homepage; "full" adds search and category filters.
export default function FAQ({ variant = 'preview' }) {
  const location = useLocation()
  const full = variant === 'full'
  const [openItems, setOpenItems] = useState(() => new Set())
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')

  useEffect(() => {
    if (!location.hash.startsWith('#faq-')) return
    const targetId = decodeURIComponent(location.hash.slice(1))
    const match = faqs.find((item) => faqId(item.question) === targetId)
    if (!match) return
    setCategory('all')
    setQuery('')
    setOpenItems((current) => new Set(current).add(targetId))
  }, [location.hash])

  const terms = normalise(query.trim()).split(/\s+/).filter(Boolean)
  const visible = useMemo(() => {
    if (!full) return faqs.filter((item) => item.featured)
    return faqs.filter((item) => (category === 'all' || item.category === category)
      && terms.every((term) => normalise(`${item.question} ${item.answer}`).includes(term)))
  }, [full, category, query]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id) => setOpenItems((current) => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  const counts = useMemo(() => Object.fromEntries(faqCategories.map(({ id }) => [id, faqs.filter((item) => item.category === id).length])), [])

  return <section id="faq" className={`data-section faq-data-section${full ? ' is-full' : ''}`} aria-labelledby="faq-heading">
    <div className="data-container">
      {full
        ? <h2 id="faq-heading" className="sr-only">Questions and answers</h2>
        : <SectionHeading id="faq-heading" eyebrow="Questions" title="Frequently asked questions" description="Straight answers to the questions Nepali students ask us most." />}
      {full && <div className="faq-tools">
        <label className="faq-search">
          <span className="sr-only">Search questions</span>
          <svg aria-hidden="true" viewBox="0 0 20 20"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search questions, e.g. IELTS, gap, work hours" autoComplete="off" />
        </label>
        <div className="faq-categories" role="group" aria-label="Filter by topic">
          <button type="button" aria-pressed={category === 'all'} onClick={() => setCategory('all')}>All <span>{faqs.length}</span></button>
          {faqCategories.map((item) => <button key={item.id} type="button" aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.label} <span>{counts[item.id]}</span></button>)}
        </div>
        <p className="faq-result-count" role="status" aria-live="polite">{visible.length === 1 ? '1 question' : `${visible.length} questions`}{query.trim() ? ` matching “${query.trim()}”` : ''}</p>
      </div>}
      {visible.length
        ? <Accordion items={visible} openItems={openItems} toggle={toggle} showCategory={full && category === 'all'} />
        : <div className="faq-empty"><p>No questions match your search.</p><button type="button" onClick={() => { setQuery(''); setCategory('all') }}>Clear search</button></div>}
      <div className="faq-footer">
        {!full && <Link className="home-text-link" to="/faqs">See all {faqs.length} questions<span aria-hidden="true">→</span></Link>}
        <p>Still unsure? <Link to="/#enquire">Book a free counselling session</Link>.</p>
      </div>
    </div>
  </section>
}
