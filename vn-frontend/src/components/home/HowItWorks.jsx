import { Link } from 'react-router-dom'
import { siteContent } from '../../data/siteContent'
import { journeySteps } from '../../data/journey'
import SectionHeading from './SectionHeading'
import ResponsiveImage from '../../ResponsiveImage'
import ScrollReveal from '../../ScrollReveal'

const icons = { conversation: '◌', compass: '◎', document: '▤', passport: '▣', plane: '↗' }

export default function HowItWorks() {
  const steps = siteContent.home.process
  if (!steps.length) return null
  return <section id="process" className="data-section process-data-section">
    <div className="data-container">
      <SectionHeading eyebrow="How it works" title="A clear path, step by step" />
      <ol className="process-timeline">
        {steps.map((step, index) => {
          const image = step.image || (index === 0 ? siteContent.home.services[0]?.image : null)
          return <ScrollReveal as="li" key={step.title} delay={index * 90}>
            {image && <ResponsiveImage image={image} className={`process-counselling-photo${image.src.endsWith('.jfif') ? ' process-illustration-photo' : ''}`} />}
            <span className="process-data-icon" aria-hidden="true">{icons[step.icon] || '•'}</span>
            <span className="process-data-number">{String(index + 1).padStart(2, '0')}</span>
            <h3>{step.title}</h3><p>{step.description}</p>
          </ScrollReveal>
        })}
      </ol>
      <p className="process-more"><Link to="/journey">See all {journeySteps.length} stages in detail<span aria-hidden="true">→</span></Link></p>
    </div>
  </section>
}
