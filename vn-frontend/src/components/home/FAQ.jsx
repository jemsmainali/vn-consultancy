import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { siteContent, siteContentReady } from '../../data/siteContent'
import SectionHeading from './SectionHeading'

const faqId = (question) => `faq-${question.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`

export default function FAQ() {
  const location = useLocation()
  const questions = siteContent.home.faqs.filter((item) => siteContentReady(item.question) && siteContentReady(item.answer))
  const [openItems, setOpenItems] = useState(() => new Set())

  useEffect(() => {
    if (!location.hash.startsWith('#faq-')) return
    const targetId = decodeURIComponent(location.hash.slice(1))
    if (questions.some((item) => faqId(item.question) === targetId)) {
      setOpenItems((current) => new Set(current).add(targetId))
    }
  }, [location.hash])

  if (!questions.length) return null
  return <section id="faq" className="data-section faq-data-section">
    <div className="data-container"><SectionHeading eyebrow="Questions" title="Frequently asked questions" />
      <div className="faq-data-list">{questions.map(({ question, answer }) => {
        const id = faqId(question)
        const expanded = openItems.has(id)
        return <article id={id} className={`faq-accordion-item${expanded ? ' is-open' : ''}`} key={id}>
          <h3><button id={`${id}-trigger`} type="button" aria-expanded={expanded} aria-controls={`${id}-panel`} onClick={() => setOpenItems((current) => {
            const next = new Set(current)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
          })}>
            <span>{question}</span><span className="faq-accordion-icon" aria-hidden="true">{expanded ? '−' : '+'}</span>
          </button></h3>
          <div id={`${id}-panel`} className="faq-accordion-panel" role="region" aria-labelledby={`${id}-trigger`} aria-hidden={!expanded}>
            <div className="faq-accordion-panel-inner"><p>{answer}</p></div>
          </div>
        </article>
      })}</div>
    </div>
  </section>
}
