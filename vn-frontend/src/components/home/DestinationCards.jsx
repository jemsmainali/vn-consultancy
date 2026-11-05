import { useState } from 'react'
import { Link } from 'react-router-dom'
import SectionHeading from './SectionHeading'
import CountryFlag from '../CountryFlag'
import ScrollReveal from '../../ScrollReveal'
import { destinationPath, destinations } from '../../data/destinations/registry'

function CardImage({ image }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <span className="destination-image-fallback" aria-hidden="true" />
  return <img src={image.src} srcSet={image.srcSet} sizes="(max-width: 560px) calc(100vw - 36px), (max-width: 1100px) 45vw, 230px" width={image.width} height={image.height} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
}

// Homepage teaser: one card per destination guide. Full details live on /destinations/:slug.
export default function DestinationCards() {
  return <section id="destinations" className="data-section destination-cards-section">
    <div className="data-container">
      <SectionHeading eyebrow="Study destinations" title="Where would you like to study?" description="Ten detailed guides with costs in Nepali rupees, visa rules, work rights and post-study options." />
      <ul className="home-destination-cards">
        {destinations.map((country, index) => <ScrollReveal as="li" key={country.slug} delay={(index % 5) * 60}>
          <Link className="home-destination-card" to={destinationPath(country)}>
            <span className="home-destination-media"><CardImage image={country.image} /></span>
            <span className="home-destination-copy">
              <span className="home-destination-name"><CountryFlag code={country.code} name="" size={18} /><strong>{country.name}</strong></span>
              <small>{country.intro}</small>
            </span>
          </Link>
        </ScrollReveal>)}
      </ul>
      <p className="home-destination-more"><Link className="home-text-link" to="/destinations">Compare all destinations</Link></p>
    </div>
  </section>
}
