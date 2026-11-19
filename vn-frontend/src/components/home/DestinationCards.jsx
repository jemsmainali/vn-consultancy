import { Link } from 'react-router-dom'
import SectionHeading from './SectionHeading'
import CountryFlag from '../CountryFlag'
import ScrollReveal from '../../ScrollReveal'
import { destinationPath, destinations } from '../../data/destinations/registry'

// Australia, USA, UK and Japan come first; the rest follow in registry order.
const priority = ['australia', 'united-states', 'united-kingdom', 'japan']
const ordered = [
  ...priority.map((slug) => destinations.find((country) => country.slug === slug)).filter(Boolean),
  ...destinations.filter((country) => !priority.includes(country.slug)),
]

// Homepage teaser: one flag + name link per destination guide. Full details live on /destinations/:slug.
export default function DestinationCards() {
  return <section id="destinations" className="data-section destination-cards-section">
    <div className="data-container">
      <SectionHeading eyebrow="Study destinations" title="Where would you like to study?" description="Ten detailed guides with costs in Nepali rupees, visa rules, work rights and post-study options." />
      <ul className="home-country-list">
        {ordered.map((country, index) => <ScrollReveal as="li" key={country.slug} delay={(index % 5) * 60}>
          <Link className="home-country-link" to={destinationPath(country)}>
            <CountryFlag code={country.code} name="" size={28} />
            <strong>{country.name}</strong>
          </Link>
        </ScrollReveal>)}
      </ul>
      <p className="home-destination-more"><Link className="home-text-link" to="/destinations">Compare all destinations</Link></p>
    </div>
  </section>
}
