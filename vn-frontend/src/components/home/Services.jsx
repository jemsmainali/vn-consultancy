import { useState } from 'react'
import ResponsiveImage from '../../ResponsiveImage'
import { siteContent } from '../../data/siteContent'
import SectionHeading from './SectionHeading'
import ScrollReveal from '../../ScrollReveal'

function ServiceCard({ service, index }) {
  const [available, setAvailable] = useState(true)
  if (!available) return null
  const illustrativeImage = service.image?.src.endsWith('.jfif')
  return <ScrollReveal as="article" className={`service-data-card${index === 0 ? ' counselling-service-card' : ''}${service.image ? ' has-image' : ''}`} id={`service-${service.id}`}>
    {service.image && <ResponsiveImage image={service.image} className={`service-data-image${illustrativeImage ? ' service-illustration-image' : ''}`} style={illustrativeImage ? { maxWidth: service.image.width, marginInline: 'auto' } : undefined} onUnavailable={() => setAvailable(false)} />}
    <div className="service-data-title-row">
      <span className="service-data-icon" aria-hidden="true">{['◌', '▤', '◇', '▣', '◎', '↗'][index]}</span>
      <h3>{service.title}</h3>
      {service.illustration && <ResponsiveImage image={service.illustration} className="service-topic-illustration" onUnavailable={() => setAvailable(false)} />}
    </div>
    <p>{service.description}</p>
    <a href="/#enquire" className="service-data-link">{service.linkLabel}<span aria-hidden="true">→</span></a>
  </ScrollReveal>
}

export default function Services() {
  const services = siteContent.home.services
  if (!services.length) return null
  return <section id="services" className="data-section services-data-section">
    <div className="data-container">
      <SectionHeading eyebrow="Our services" title="Support for each step" />
      <div className="services-data-grid">
        {services.map((service, index) => <ServiceCard key={service.id} service={service} index={index} />)}
      </div>
    </div>
  </section>
}
