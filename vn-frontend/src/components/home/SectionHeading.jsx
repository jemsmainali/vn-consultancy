import ScrollReveal from '../../ScrollReveal'

export default function SectionHeading({ eyebrow, title, description, id, centered = true }) {
  return (
    <ScrollReveal as="header" className={`data-section-heading mx-auto mb-9${centered ? ' is-centered' : ''}`}>
      {eyebrow && <p className="data-eyebrow">{eyebrow}</p>}
      <h2 id={id}>{title}</h2>
      {description && <p className="data-section-description">{description}</p>}
    </ScrollReveal>
  )
}
