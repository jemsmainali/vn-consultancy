import { siteContent } from '../../data/siteContent'
import SectionHeading from './SectionHeading'
import ResponsiveImage from '../../ResponsiveImage'

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
          return <li key={step.title}>
            {image && <ResponsiveImage image={image} className={`process-counselling-photo${image.src.endsWith('.jfif') ? ' process-illustration-photo' : ''}`} style={image.src.endsWith('.jfif') ? { maxWidth: image.width, marginInline: 'auto' } : undefined} />}
            <span className="process-data-icon" aria-hidden="true">{icons[step.icon] || '•'}</span>
            <span className="process-data-number">{String(index + 1).padStart(2, '0')}</span>
            <h3>{step.title}</h3><p>{step.description}</p>
          </li>
        })}
      </ol>
    </div>
  </section>
}
