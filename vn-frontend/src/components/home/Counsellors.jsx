import { useState } from 'react'
import { siteContentReady, siteContent } from '../../data/siteContent'
import SectionHeading from './SectionHeading'

const complete = (person) => [person.name, person.role, person.experience, person.specialties, person.photo?.src, person.photo?.alt].every((value) => siteContentReady(String(value ?? '')))

function CounsellorCard({ person }) {
  const [available, setAvailable] = useState(true)
  if (!available) return null
  return <article className="counsellor-data-card">
    <img src={person.photo.src} alt={person.photo.alt} loading="lazy" onError={() => setAvailable(false)} />
    <h3>{person.name}</h3><p>{person.role}</p><p>{person.experience} years of experience</p><p>{person.specialties.join(', ')}</p>
  </article>
}

export default function Counsellors() {
  const people = siteContent.home.counsellors.filter(complete)
  if (!people.length) return null
  return <section id="team" className="data-section counsellors-data-section">
    <div className="data-container"><SectionHeading eyebrow="Our team" title="Meet the counsellors" />
      <div className="counsellor-data-grid">{people.map((person) => <CounsellorCard key={person.name} person={person} />)}</div>
    </div>
  </section>
}
