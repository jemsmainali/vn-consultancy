import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { siteContent } from '../../data/siteContent'
import { journeySteps } from '../../data/journey'
import ResponsiveImage from '../../ResponsiveImage'
import { gsap, ScrollTrigger, revealOnScroll } from './sectionMotion'
import '../../services-journey.css'

const pad = (n) => String(n).padStart(2, '0')

export default function HowItWorks() {
  const sectionRef = useRef(null)
  const [active, setActive] = useState(0)
  const steps = siteContent.home.process

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return undefined
    const ctx = gsap.context(() => {
      const list = section.querySelector('.path-steps')
      // Active step follows the reading line; this is state, not motion, so it also runs with reduced motion.
      section.querySelectorAll('.path-step').forEach((step, index) => {
        ScrollTrigger.create({ trigger: step, start: 'top 55%', end: 'bottom 55%', onToggle: (self) => self.isActive && setActive(index) })
      })

      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        revealOnScroll(section.querySelectorAll('[data-path-reveal]'), { y: 28 })
        revealOnScroll(section.querySelectorAll('.path-step'), { y: 36, stagger: 0.08, start: 'top 90%' })
        gsap.fromTo(section.querySelector('.path-line-fill'), { scaleY: 0 }, {
          scaleY: 1, ease: 'none',
          scrollTrigger: { trigger: list, start: 'top 55%', end: 'bottom 55%', scrub: 0.4 },
        })
        const stage = section.querySelector('.path-stage-frame')
        if (stage) {
          gsap.fromTo(stage, { clipPath: 'inset(8% 8% 8% 8%)' }, {
            clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.out',
            scrollTrigger: { trigger: section, start: 'top 80%', end: 'top 25%', scrub: 0.6 },
          })
        }
      })
    }, section)
    return () => ctx.revert()
  }, [])

  if (!steps.length) return null
  const current = steps[active]

  return <section id="process" ref={sectionRef} className="path-section" aria-labelledby="process-title">
    <div className="sj-container">
      <header className="sj-head is-dark">
        <div>
          <p className="sj-eyebrow" data-path-reveal>How it works</p>
          <h2 id="process-title" data-path-reveal>Your journey abroad, in six clear steps.</h2>
        </div>
        <p className="sj-lede" data-path-reveal>Each stage builds on the last. You always know where you are, what comes next and what you need to prepare.</p>
      </header>

      <div className="path-layout">
        <div className="path-stage" aria-hidden="true">
          <div className="path-stage-frame">
            {steps.map((step, index) => <ResponsiveImage key={step.title} image={step.image} className={`path-stage-image${index === active ? ' is-active' : ''}`} alt="" />)}
            <div className="path-stage-caption">
              <span>Step {pad(active + 1)} <i>/ {pad(steps.length)}</i></span>
              <strong key={current.title}>{current.title}</strong>
            </div>
          </div>
        </div>

        <div className="path-track">
          <span className="path-line" aria-hidden="true"><span className="path-line-fill" /></span>
          <ol className="path-steps">
            {steps.map((step, index) => <li key={step.title} className={`path-step${index === active ? ' is-active' : ''}${index < active ? ' is-done' : ''}`}>
              <span className="path-num" aria-hidden="true">{pad(index + 1)}</span>
              <div className="path-step-body">
                <ResponsiveImage image={step.image} className="path-step-media" />
                <h3><span className="sr-only">Step {index + 1}: </span>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>)}
          </ol>
        </div>
      </div>

      <div className="path-foot" data-path-reveal>
        <Link className="svc-cta" to="/#enquire">Start with free counselling<span aria-hidden="true">→</span></Link>
        <Link className="path-more" to="/journey">See all {journeySteps.length} stages in detail<span aria-hidden="true">→</span></Link>
      </div>
      {steps.some((step) => step.image?.licensed) && <p className="sj-credit">Counselling, course and visa photos: VN Group. Other photographs are illustrative stock images.</p>}
    </div>
  </section>
}
