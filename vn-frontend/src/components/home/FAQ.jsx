import { siteContent, siteContentReady } from '../../data/siteContent'
import SectionHeading from './SectionHeading'

export default function FAQ() {
  const questions = siteContent.home.faqs.filter((item) => siteContentReady(item.question) && siteContentReady(item.answer))
  if (!questions.length) return null
  return <section id="faq" className="data-section faq-data-section">
    <div className="data-container"><SectionHeading eyebrow="Questions" title="Frequently asked questions" />
      <div className="faq-data-list">{questions.map(({ question, answer }) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
    </div>
  </section>
}
