import { siteContent, siteContentReady } from '../../data/siteContent'
import { useState } from 'react'
import ResponsiveImage from '../../ResponsiveImage'
import SectionHeading from './SectionHeading'
import CountryFlag from '../CountryFlag'

function isComplete(country) {
  return [country.intro, country.intakes, country.tuitionRange, country.livingCostRange, country.requirements].every(siteContentReady)
}

function CountryCard({ country }) {
  const [available, setAvailable] = useState(true)
  if (!available) return null
  return <article className="destination-data-card">
    <div className="destination-data-visual">
      {country.image && <ResponsiveImage image={country.image} className="destination-data-image" onUnavailable={() => setAvailable(false)} />}
      <div className="destination-card-heading"><CountryFlag code={country.code} name={country.name} size={32} /><h3>{country.name}</h3></div>
    </div>
    <p>{country.intro}</p>
    <dl>
      <div><dt>Intakes</dt><dd>{country.intakes}</dd></div>
      <div><dt>Typical tuition</dt><dd>{country.tuitionRange}</dd></div>
      <div><dt>Typical living costs</dt><dd>{country.livingCostRange}</dd></div>
      <div><dt>Key requirements</dt><dd>{country.requirements}</dd></div>
    </dl>
    <a className="button" href={`/?country=${encodeURIComponent(country.name)}#enquire`}>Get free advice</a>
  </article>
}

export default function DestinationCards() {
  const countries = siteContent.home.countries.filter(isComplete)
  if (!countries.length) return null
  return <section id="destinations" className="data-section destination-cards-section">
    <div className="data-container">
      <SectionHeading eyebrow="Study destinations" title="Explore your options" description="Compare destination details and discuss your plans with a counsellor." />
      <div className="destination-data-grid">
        {countries.map((country) => <CountryCard key={country.name} country={country} />)}
      </div>
    </div>
  </section>
}
