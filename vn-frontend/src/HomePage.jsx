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

const hero = siteContent.home.hero

export default function HomePage() {
  return <div className="home-page data-home-page" id="top">
    <section className="home-hero data-home-hero" aria-labelledby="home-title">
      <div className="home-container home-hero-grid">
        <div className="home-hero-copy hero-in">
          <p className="home-eyebrow">{hero.eyebrow}</p>
          <h1 id="home-title">{hero.title} <em>{hero.emphasis}</em></h1>
          <p>{hero.description}</p>
          <div className="home-actions">
            <a className="home-button" href="#enquire">{hero.primaryLabel}<span aria-hidden="true">↗</span></a>
            <a className="home-text-link" href="/destinations">{hero.secondaryLabel}<span aria-hidden="true">→</span></a>
          </div>
        </div>
        <div className="home-hero-media hero-in" style={{ animationDelay: '120ms' }}>
          <ResponsiveImage image={hero.photo} className="home-hero-photo" loading="eager" fetchPriority="high" objectPosition="center 40%" />
        </div>
      </div>
    </section>
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
