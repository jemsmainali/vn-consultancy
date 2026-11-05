import { useLayoutEffect, useRef } from 'react'
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
import { gsap } from './components/home/sectionMotion'
import './home-hero.css'

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
  return <Link className="vn-hero-country" to={guide ? destinationPath(guide) : '/destinations'}>
    <CountryFlag code={country.code} name={country.name} size={16} />
    <span>{visibleCountryName(country)}</span>
  </Link>
}

function HomeHero() {
  const heroRef = useRef(null)

  useLayoutEffect(() => {
    const hero = heroRef.current
    if (!hero) return undefined
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const photo = hero.querySelector('.vn-hero-media')
        const lines = hero.querySelectorAll('[data-hero-line]')
        const fades = hero.querySelectorAll('[data-hero-fade]')
        // Opening: the photo settles from a slow push-in while the headline rises line by line.
        gsap.timeline({ defaults: { ease: 'power3.out' } })
          .from(photo, { scale: 1.14, opacity: 0, duration: 2.2, ease: 'power2.out' })
          .from(lines, { yPercent: 110, duration: 1.25, stagger: 0.14, ease: 'power4.out' }, 0.35)
          .from(fades, { opacity: 0, y: 24, duration: 1, stagger: 0.1, clearProps: 'opacity,transform' }, 0.95)
        // Leaving: the photo drifts slower than the page and the copy lifts away as the hero scrolls out.
        const leave = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
        gsap.to(photo, { yPercent: 16, ease: 'none', scrollTrigger: leave })
        gsap.to(hero.querySelector('.vn-hero-inner'), { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: { ...leave, end: '85% top' } })
        gsap.to(hero.querySelector('.vn-hero-dim'), { opacity: 0.7, ease: 'none', scrollTrigger: leave })
      })
    }, hero)
    return () => ctx.revert()
  }, [])

  return <section ref={heroRef} className="vn-hero" aria-labelledby="home-title">
    <div className="vn-hero-media">
      <ResponsiveImage image={hero.photo} className="vn-hero-photo" loading="eager" fetchPriority="high" objectPosition="center 42%" />
    </div>
    <div className="vn-hero-shade" aria-hidden="true" />
    <div className="vn-hero-dim" aria-hidden="true" />
    <div className="vn-hero-inner">
      <p className="vn-hero-eyebrow" data-hero-fade>Since {foundedYear} <span aria-hidden="true">·</span> {yearsExperience}+ {hero.eyebrow}</p>
      <h1 id="home-title" className="vn-hero-title">
        <span className="vn-hero-line"><span data-hero-line>{hero.title}</span></span>
        <span className="vn-hero-line"><em data-hero-line>{hero.emphasis}</em></span>
      </h1>
      <div className="vn-hero-foot">
        <p className="vn-hero-lede" data-hero-fade>{hero.description}</p>
        <div className="vn-hero-actions" data-hero-fade>
          <Link className="vn-hero-button" to="/#enquire">{hero.primaryLabel}<span aria-hidden="true">↗</span></Link>
          <Link className="vn-hero-button vn-hero-button-ghost" to="/destinations">{hero.secondaryLabel}<span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </div>
    <div className="vn-hero-rail" data-hero-fade>
      <nav className="vn-hero-countries" aria-label="Popular study destinations">
        {popularCountries.map((country) => <HeroCountry key={country.name} country={country} />)}
      </nav>
      <Link className="vn-hero-scroll" to="/#about-vn"><span>Scroll</span><i aria-hidden="true" /></Link>
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
