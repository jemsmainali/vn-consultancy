import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ResponsiveImage from './ResponsiveImage'
import { siteContent } from './data/siteContent'
import TrustStrip from './components/home/TrustStrip'
import DestinationCards from './components/home/DestinationCards'
import HowItWorks from './components/home/HowItWorks'
import Services from './components/home/Services'
import SuccessStories from './components/home/SuccessStories'
import PartnerLogos from './components/home/PartnerLogos'
import EnquirySection from './components/home/EnquirySection'
import Counsellors from './components/home/Counsellors'
import FAQ from './components/home/FAQ'
import CountryFlag from './components/CountryFlag'

const hero = siteContent.home.hero
const foundedYear = siteContent.brand.foundedYear
const yearsExperience = new Date().getFullYear() - foundedYear
const visibleCountryName = (country) => country.name === 'United States' ? 'USA' : country.name === 'South Korea' ? 'Korea' : country.name
const rotationCountries = hero.rotatingCountries
  .map((name) => siteContent.home.countries.find((country) => country.name === name))
  .filter(Boolean)
const popularCountries = rotationCountries.slice(0, 5)

function HeroCountry({ country }) {
  return <Link className="hero-country-chip" to={`/destinations?country=${encodeURIComponent(country.name)}`}>
    <CountryFlag code={country.code} name={country.name} size={19} />
    <span>{visibleCountryName(country)}</span>
  </Link>
}

function HomeHero() {
  const [countryIndex, setCountryIndex] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const displayedCountry = rotationCountries[countryIndex] || rotationCountries[0]
  const hasCounselling = siteContent.home.services.some((service) => service.title.toLowerCase().includes('counselling'))
  const hasVisaSupport = siteContent.home.services.some((service) => service.title.toLowerCase().includes('visa'))

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => setReducedMotion(media.matches)
    media.addEventListener?.('change', updateMotion)
    return () => media.removeEventListener?.('change', updateMotion)
  }, [])

  useEffect(() => {
    if (reducedMotion || rotationCountries.length < 2) return undefined
    const interval = window.setInterval(() => {
      setCountryIndex((index) => (index + 1) % rotationCountries.length)
    }, 2500)
    return () => window.clearInterval(interval)
  }, [reducedMotion])

  return <section className="home-hero data-home-hero" aria-labelledby="home-title">
    <div className="home-container home-hero-grid">
      <div className="home-hero-copy hero-in">
        <p className="home-eyebrow home-hero-pill">Since {foundedYear} <span aria-hidden="true">·</span> {yearsExperience}+ {hero.eyebrow}</p>
        <h1 id="home-title">{hero.title}<span className="home-hero-country" aria-live="polite" aria-atomic="true">{displayedCountry && <span key={displayedCountry.name} className={reducedMotion ? '' : 'is-rotating'}>{visibleCountryName(displayedCountry)}</span>}</span></h1>
        <p className="home-hero-description">{hero.description}</p>
        <div className="home-actions">
          <a className="home-button" href="#enquire">{hero.primaryLabel}<span aria-hidden="true">↗</span></a>
          <a className="home-text-link" href="/destinations">{hero.secondaryLabel}<span aria-hidden="true">→</span></a>
        </div>
        <nav className="home-hero-countries" aria-label="Popular study destinations">
          {popularCountries.map((country) => <HeroCountry key={country.name} country={country} />)}
        </nav>
      </div>
      <div className="home-hero-media hero-in" style={{ animationDelay: '120ms' }}>
        <ResponsiveImage image={hero.photo} className="home-hero-photo" loading="eager" fetchPriority="high" objectPosition="center 40%" />
        <div className="home-hero-proof-card">
          <strong>{yearsExperience}+</strong>
          <span>Years of trusted guidance</span>
        </div>
        {(hasCounselling || hasVisaSupport) && <div className="home-hero-services-card">
          {hasCounselling && <span><b aria-hidden="true">✓</b> Free counselling</span>}
          {hasVisaSupport && <span><b aria-hidden="true">✓</b> Visa support</span>}
        </div>}
      </div>
    </div>
  </section>
}

export default function HomePage() {
  return <div className="home-page data-home-page" id="top">
    <HomeHero />
    <TrustStrip />
    <DestinationCards />
    <HowItWorks />
    <Services />
    <SuccessStories />
    <PartnerLogos />
    <EnquirySection />
    <Counsellors />
    <FAQ />
  </div>
}

