import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import ResponsiveImage from '../ResponsiveImage'
import ScrollReveal from '../ScrollReveal'
import { journeyDisclaimer, journeySteps } from '../data/journey'

const blocks = [
  { key: 'student', title: 'What you do' },
  { key: 'support', title: 'How VN Group helps' },
  { key: 'documents', title: 'Documents you may need' },
  { key: 'factors', title: 'What can affect timing' },
]

// Fills the timeline rail as the reader scrolls through the steps.
function useTimelineProgress(ref) {
  useEffect(() => {
    const node = ref.current
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node?.style.setProperty('--journey-fill', '1')
      return undefined
    }
    let frame = 0
    const update = () => {
      frame = 0
      const box = node.getBoundingClientRect()
      const progress = Math.min(1, Math.max(0, (window.innerHeight * 0.55 - box.top) / box.height))
      node.style.setProperty('--journey-fill', progress.toFixed(3))
    }
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [ref])
}

export default function Journey() {
  const timelineRef = useRef(null)
  useTimelineProgress(timelineRef)

  return <div className="journey-page">
    <header className="destinations-hero journey-hero">
      <div className="data-container">
        <p className="data-eyebrow">How it works</p>
        <h1>Your study abroad journey, step by step</h1>
        <p>Eleven stages from your first counselling session to your first weeks abroad: what you do, how we help, which documents you may need and what can affect the timeline.</p>
        <nav className="journey-jump" aria-label="Jump to a stage">
          <ol>{journeySteps.map((step, index) => <li key={step.id}><a href={`#step-${step.id}`}><span>{index + 1}</span>{step.title}</a></li>)}</ol>
        </nav>
      </div>
    </header>

    <div className="data-container">
      <p className="journey-disclaimer" role="note"><strong>Please note:</strong> {journeyDisclaimer} Timings are typical planning ranges and differ by country, institution and season.</p>
      <ol className="journey-timeline" ref={timelineRef}>
        {journeySteps.map((step, index) => <li key={step.id} id={`step-${step.id}`} className="journey-step">
          <span className="journey-step-marker" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <ScrollReveal className="journey-step-card" delay={60}>
            <div className="journey-step-head">
              <div>
                <p className="journey-step-time">Stage {index + 1} · {step.time}</p>
                <h2>{step.title}</h2>
                <p>{step.summary}</p>
              </div>
              {step.image && <ResponsiveImage image={step.image} className={`journey-step-image${step.image.src.endsWith('.jfif') ? ' is-illustration' : ''}`} alt="" />}
            </div>
            <div className="journey-step-grid">
              {blocks.map((block) => <div key={block.key} className={`journey-block is-${block.key}`}>
                <h3>{block.title}</h3>
                <ul>{step[block.key].map((item) => <li key={item}>{item}</li>)}</ul>
              </div>)}
            </div>
          </ScrollReveal>
        </li>)}
      </ol>
    </div>

    <section className="destination-cta-band">
      <div className="data-container destination-cta-inner">
        <div>
          <h2>Ready for stage one?</h2>
          <p>Book a free counselling session and we’ll map out the stages for your plans and timeline. You can also <Link to="/destinations">compare destinations</Link> or read our <Link to="/faqs">FAQs</Link>.</p>
        </div>
        <a className="home-button" href="/#enquire">Book free counselling<span aria-hidden="true">→</span></a>
      </div>
    </section>
  </div>
}
