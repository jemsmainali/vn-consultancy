import { Link } from 'react-router-dom'
import ResponsiveImage from './ResponsiveImage'
import ScrollReveal from './ScrollReveal'
import { siteContent, siteImages, yearsOfExperience } from './data/siteContent'
import DestinationCards from './components/home/DestinationCards'
import HowItWorks from './components/home/HowItWorks'
import Services from './components/home/Services'
import SuccessStories from './components/home/SuccessStories'
import PartnerLogos from './components/home/PartnerLogos'
import EnquirySection from './components/home/EnquirySection'
import Counsellors from './components/home/Counsellors'
import FAQ from './components/home/FAQ'
import JourneyGallery from './components/home/JourneyGallery'
import CountUp from './components/home/CountUp'
import CountryFlag from './components/CountryFlag'
import { destinationByName, destinationPath } from './data/destinations/registry'

const hero = siteContent.home.hero
const foundedYear = siteContent.brand.foundedYear
const yearsExperience = yearsOfExperience()
const visibleCountryName = (country) => country.name === 'United States' ? 'USA' : country.name === 'South Korea' ? 'Korea' : country.name
const popularCountries = hero.rotatingCountries
  .map((name) => siteContent.home.countries.find((country) => country.name === name))
  .filter(Boolean)
  .slice(0, 5)

function HeroCountry({ country }) {
  const guide = destinationByName(country.name)
  return <Link className="hero-country-chip" to={guide ? destinationPath(guide) : '/destinations'}>
    <CountryFlag code={country.code} name={country.name} size={19} />
    <span>{visibleCountryName(country)}</span>
  </Link>
}

function HomeHero() {
  const hasCounselling = siteContent.home.services.some((service) => service.title.toLowerCase().includes('counselling'))
  const hasVisaSupport = siteContent.home.services.some((service) => service.title.toLowerCase().includes('visa'))

  return <section className="home-hero data-home-hero" aria-labelledby="home-title">
    <div className="home-container home-hero-grid">
      <div className="home-hero-copy">
        <p className="home-eyebrow home-hero-pill hero-in">Since {foundedYear} <span aria-hidden="true">·</span> {yearsExperience}+ {hero.eyebrow}</p>
        <h1 id="home-title" className="hero-in" style={{ animationDelay: '80ms' }}>{hero.title} <em>{hero.emphasis}</em></h1>
        <p className="home-hero-description hero-in" style={{ animationDelay: '160ms' }}>{hero.description}</p>
        <div className="home-actions hero-in" style={{ animationDelay: '240ms' }}>
          <a className="home-button" href="#enquire">{hero.primaryLabel}<span aria-hidden="true">↗</span></a>
          <Link className="home-button home-button-ghost" to="/destinations">{hero.secondaryLabel}<span aria-hidden="true">→</span></Link>
        </div>
        <nav className="home-hero-countries hero-in" style={{ animationDelay: '320ms' }} aria-label="Popular study destinations">
          {popularCountries.map((country) => <HeroCountry key={country.name} country={country} />)}
        </nav>
      </div>
      <div className="home-hero-media hero-in hero-in-media" style={{ animationDelay: '160ms' }}>
        <span className="home-hero-glow" aria-hidden="true" />
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

function HomeAbout() {
  const facts = [
    { value: yearsExperience, suffix: '+', label: 'Years guiding students' },
    { value: siteContent.home.countries.length, label: 'Study destinations' },
    { value: siteContent.home.services.length, label: 'Support services' },
  ]
  return <section id="about-vn" className="data-section home-about-section" aria-labelledby="home-about-title">
    <div className="data-container home-about-grid">
      <ScrollReveal className="home-about-media" direction="left">
        <ResponsiveImage image={siteImages.partnerMeeting} className="home-about-photo" />
      </ScrollReveal>
      <ScrollReveal className="home-about-copy" direction="right" delay={80}>
        <p className="data-eyebrow">About VN Group</p>
        <h2 id="home-about-title">Guiding Nepali students since {foundedYear}.</h2>
        <p>We bridge the gap between ambitious students in Nepal and world-class international education — with transparent guidance, careful document preparation and honest counselling at every step.</p>
        <dl className="home-about-facts">
          {facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd><CountUp value={fact.value} suffix={fact.suffix} /></dd></div>)}
        </dl>
        <Link className="home-text-link" to="/about">Meet our founder<span aria-hidden="true">→</span></Link>
      </ScrollReveal>
    </div>
  </section>
}

export default function HomePage() {
  return <div className="home-page data-home-page" id="top">
    <HomeHero />
    <HomeAbout />
    <DestinationCards />
    <Services />
    <HowItWorks />
    <PartnerLogos />
    <SuccessStories />
    <JourneyGallery />
    <Counsellors />
    <FAQ />
    <EnquirySection />
  </div>
}
