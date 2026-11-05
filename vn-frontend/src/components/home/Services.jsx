import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import ResponsiveImage from '../../ResponsiveImage'
import { siteContent } from '../../data/siteContent'
import { gsap, revealOnScroll } from './sectionMotion'
import '../../services-journey.css'

function ServiceLink({ service, className }) {
  const label = <>{service.linkLabel}</>
  // Hash links go through the router too; ScrollManager scrolls to the section.
  return <Link className={className} to={service.to}>{label}</Link>
}

function ServiceCard({ service, index }) {
  const featured = index === 0
  return <article id={`service-${service.id}`} className={`svc-card svc-card-${index}${featured ? ' is-featured' : ''}`} data-svc-card>
    <div className="svc-media">
      <ResponsiveImage image={service.image} className="svc-image" />
    </div>
    <div className="svc-body">
      <span className="svc-index">{String(index + 1).padStart(2, '0')}</span>
      <h3>{service.title}</h3>
      <p>{service.description}</p>
      {featured && service.points && <ul className="svc-points">{service.points.map((point) => <li key={point}>{point}</li>)}</ul>}
      <ServiceLink service={service} className={featured ? 'svc-cta' : 'svc-link'} />
    </div>
  </article>
}

export default function Services() {
  const sectionRef = useRef(null)
  const services = siteContent.home.services

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return undefined
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        revealOnScroll(section.querySelectorAll('[data-svc-reveal]'), { y: 28 })
        revealOnScroll(section.querySelectorAll('[data-svc-card]'), { y: 48, stagger: 0.12 })
        // Gentle parallax on the featured photo only.
        const featuredImage = section.querySelector('.svc-card.is-featured img')
        if (featuredImage) {
          gsap.fromTo(featuredImage, { yPercent: -6 }, {
            yPercent: 6, ease: 'none',
            scrollTrigger: { trigger: featuredImage.closest('.svc-card'), start: 'top bottom', end: 'bottom top', scrub: true },
          })
        }
      })
    }, section)
    return () => ctx.revert()
  }, [])

  if (!services.length) return null
  const hasLicensedPhotos = services.some((service) => service.image?.licensed)

  return <section id="services" ref={sectionRef} className="svc-section" aria-labelledby="services-title">
    <div className="sj-container">
      <header className="sj-head">
        <div>
          <p className="sj-eyebrow" data-svc-reveal>Our services</p>
          <h2 id="services-title" data-svc-reveal>Everything you need, from first conversation to first semester.</h2>
        </div>
        <p className="sj-lede" data-svc-reveal>Six focused services, delivered by counsellors who know each destination’s requirements. Use one, or let us guide you through the whole journey.</p>
      </header>
      <div className="svc-grid">
        {services.map((service, index) => <ServiceCard key={service.id} service={service} index={index} />)}
      </div>
      {hasLicensedPhotos && <p className="sj-credit">Counselling, admissions and visa photos: VN Group. Other photographs are illustrative stock images.</p>}
    </div>
  </section>
}
