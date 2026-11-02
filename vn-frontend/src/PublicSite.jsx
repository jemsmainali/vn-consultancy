import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './auth'
import CeoMessage from './CeoMessage'
import ScrollReveal from './ScrollReveal'
import ResponsiveImage from './ResponsiveImage'
import { siteContent, siteContentReady, siteImages, yearsOfExperience } from './data/siteContent'
import { destinationBySlug, destinationPath, destinations } from './data/destinations/registry'
import CountryFlag from './components/CountryFlag'
import SiteFooter from './components/layout/SiteFooter'
import ChatWidget from './components/layout/ChatWidget'
import LegalPage from './components/layout/LegalPage'
import EnquirySection from './components/home/EnquirySection'
import FAQ from './components/home/FAQ'

const observedSectionIds = ['destinations', 'process', 'services', 'stories', 'enquire', 'faq']
const foundedYear = siteContent.brand.foundedYear
const yearsExperience = yearsOfExperience()
// Destination detail pages get their title from the registry; everything else is listed here.
const metadataFor = (pathname) => {
  const destination = pathname.startsWith('/destinations/') && destinationBySlug(pathname.split('/')[2])
  if (destination) return [`Study in ${destination.name} from Nepal | VN Group`, `${destination.name}: costs in local currency and NPR, admission, scholarships, student visa, work rights and post-study options, with official sources.`]
  return pageMetadata[pathname]
}

const pageMetadata = {
  '/': [`${yearsExperience}+ Years of Study Abroad Guidance | VN Group`, `${yearsExperience}+ years of study abroad guidance for students in Nepal. Explore study options and plan your next steps with VN Group.`],
  '/about': ['Leadership & Vision | VN Group', 'A message from VN Group leadership to students in Nepal exploring international education.'],
  '/destinations': ['Study Destinations for Nepali Students | VN Group', 'Compare costs, visas, work rights and post-study options in 10 study destinations, with official sources and dated exchange rates.'],
  '/journey': ['How It Works – The Student Journey | VN Group', 'Eleven stages from free counselling to arrival abroad: what you do, how VN Group helps, documents needed and what affects the timeline.'],
  '/faqs': ['Study Abroad FAQs for Nepali Students | VN Group', 'Searchable answers on eligibility, English tests, costs, visas, part-time work and post-study options.'],
  '/gallery': ['Gallery | VN Group', 'Visa success stories, student departures and partner visits from VN Group Study Abroad in Kathmandu.'],
  '/contact': ['Contact VN Group | Student Enquiry', 'Send a study enquiry to VN Group. Your message is saved before a confirmation is shown.'],
  '/privacy': ['Privacy Policy | VN Group', 'Privacy policy information for VN Group Study Abroad.'],
  '/terms': ['Terms | VN Group', 'Terms information for VN Group Study Abroad.'],
  '/refund-policy': ['Refund Policy | VN Group', 'Refund information for VN Group Study Abroad.'],
}

function NavIcon({ name }) {
  const paths = {
    conversation: <><path d="M3.5 4.5h13v9h-7l-4 3v-3h-2z"/><path d="M6.5 8h7m-7 3h4"/></>,
    document: <><path d="M5 2.8h7l3 3v11.4H5z"/><path d="M12 2.8v3h3M7.5 9h5m-5 3h5"/></>,
    award: <><circle cx="10" cy="7" r="4"/><path d="m7.4 10.2-.7 6 3.3-1.8 3.3 1.8-.7-6"/></>,
    passport: <><rect x="4" y="2.8" width="12" height="14.4" rx="1.5"/><circle cx="10" cy="8" r="2.4"/><path d="M6.5 13h7"/></>,
    language: <><circle cx="10" cy="10" r="7"/><path d="M3.5 10h13M10 3c2 2 2 12 0 14m0-14c-2 2-2 12 0 14"/></>,
    plane: <><path d="m2.5 11 15-6-5.3 12-2.5-4.2z"/><path d="m9.7 12.8 3.5-3.5"/></>,
    story: <><path d="M10 5.5C8.5 4.3 6.3 3.8 3 4v11.5c3.3-.2 5.5.3 7 1.5 1.5-1.2 3.7-1.7 7-1.5V4c-3.3-.2-5.5.3-7 1.5z"/><path d="M10 5.5V17"/></>,
    team: <><circle cx="7.5" cy="7" r="2.7"/><path d="M2.5 16.5c.4-3 2.1-4.5 5-4.5s4.6 1.5 5 4.5"/><path d="M12.8 4.6a2.5 2.5 0 0 1 0 4.8m1.8 2.9c1.6.5 2.6 1.9 2.9 4.2"/></>,
    shield: <><path d="M10 2.8 4 5v4.6c0 3.7 2.5 6.4 6 7.6 3.5-1.2 6-3.9 6-7.6V5z"/><path d="m7.4 10 1.8 1.8 3.5-3.6"/></>,
    university: <><path d="M2.8 7 10 3.2 17.2 7z"/><path d="M4.5 7.5V14m3.8-6.5V14m3.4-6.5V14m3.8-6.5V14M3 16.8h14"/></>,
    star: <path d="m10 3 2.1 4.4 4.7.6-3.4 3.3.9 4.7L10 13.7 5.7 16l.9-4.7L3.2 8l4.7-.6z"/>,
    pen: <><path d="M3.5 16.5h13"/><path d="M12.6 3.9a1.6 1.6 0 0 1 2.3 2.3l-7.4 7.4-3 .8.8-3z"/></>,
    question: <><circle cx="10" cy="10" r="7"/><path d="M8 7.9a2.1 2.1 0 0 1 4 .7c0 1.4-2 1.8-2 3m0 2.6h.01"/></>,
    route: <><circle cx="5" cy="15" r="1.8"/><circle cx="15" cy="5" r="1.8"/><path d="M6.8 15h5.7a2.5 2.5 0 0 0 0-5h-5a2.5 2.5 0 0 1 0-5h5.7"/></>,
    gallery: <><rect x="3" y="4" width="14" height="12" rx="1.5"/><circle cx="7.3" cy="8.2" r="1.3"/><path d="m3.5 14.5 4-4 3 3 2-2 4 4"/></>,
  }
  return <svg className="nav-item-icon" aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState('')
  const [isScrolled, setIsScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > 20)
  // True while the header still sits over the homepage's full-screen hero photo.
  const [isOverHero, setIsOverHero] = useState(true)
  const location = useLocation()
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState('')
  const dropdownRefs = useRef({})
  const triggerRefs = useRef({})
  const menuButtonRef = useRef(null)
  const navRef = useRef(null)
  const hoverTimers = useRef({})
  const dropdownGroups = [
    { id: 'about', label: 'About', items: siteContent.navigation.about, icon: true },
    { id: 'services', label: 'Services', items: siteContent.navigation.services, icon: true },
    { id: 'destinations', label: 'Destinations', items: destinations.map((item) => ({ label: item.name, code: item.code, to: destinationPath(item) })), destination: true },
    { id: 'resources', label: 'Resources', items: siteContent.navigation.resources, icon: true },
  ]
  const closeMenu = () => { setMenuOpen(false); setOpenDropdown('') }
  const isHome = location.pathname === '/'
  const linkTo = (to) => to.startsWith('/#') && location.pathname !== '/' ? `/${to.slice(1)}` : to

  const scheduleDropdown = (id, delay, action) => {
    window.clearTimeout(hoverTimers.current[id])
    hoverTimers.current[id] = window.setTimeout(action, delay)
  }

  useEffect(() => {
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        const nextIsScrolled = window.scrollY > 20
        const nextIsOverHero = window.scrollY < window.innerHeight - 96
        setIsScrolled((current) => current === nextIsScrolled ? current : nextIsScrolled)
        setIsOverHero((current) => current === nextIsOverHero ? current : nextIsOverHero)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    const [title, description] = metadataFor(location.pathname) || ['Page not found | VN Group', 'This VN Group page is not available. Return to the homepage to continue.']
    document.title = title
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title)
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description)
  }, [location.pathname])

  useEffect(() => {
    if (!isHome) return undefined
    const contact = siteContent.contact
    const socials = contact.socials
      .filter((item) => siteContentReady(item.label) && siteContentReady(item.url))
      .map((item) => item.url)
    const organization = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: siteContent.brand.name,
      url: window.location.origin,
      logo: new URL(siteContent.brand.logo.src, window.location.origin).href,
      ...(Number.isFinite(foundedYear) ? { foundingDate: String(foundedYear) } : {}),
      ...(siteContentReady(contact.address) ? { address: { '@type': 'PostalAddress', streetAddress: contact.address } } : {}),
      ...(socials.length ? { sameAs: socials } : {}),
    }
    const script = document.createElement('script')
    script.id = 'vn-group-organization-jsonld'
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(organization)
    document.head.append(script)
    return () => script.remove()
  }, [isHome])

  useEffect(() => {
    if (!location.hash) return undefined
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(decodeURIComponent(location.hash.slice(1)))
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      target?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
    })
    return () => cancelAnimationFrame(frame)
  }, [location.pathname, location.hash])

  useEffect(() => {
    if (!isHome || !('IntersectionObserver' in window)) return undefined
    const sections = observedSectionIds.map((id) => document.getElementById(id)).filter(Boolean)
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)
      if (visible[0]) setActiveSection(visible[0].target.id)
    }, { rootMargin: '-22% 0px -66% 0px', threshold: [0, .2, .5] })
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [isHome])

  useEffect(() => {
    const onPointerDown = (event) => {
      if (openDropdown && !dropdownRefs.current[openDropdown]?.contains(event.target)) setOpenDropdown('')
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (openDropdown) {
          triggerRefs.current[openDropdown]?.focus()
          setOpenDropdown('')
        } else if (menuOpen) {
          setMenuOpen(false)
          menuButtonRef.current?.focus()
        }
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [openDropdown, menuOpen])

  useEffect(() => {
    closeMenu()
  }, [location.pathname, location.search, location.hash])

  useEffect(() => {
    if (!menuOpen || window.innerWidth >= 1024) return undefined
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusable = () => [...(navRef.current?.querySelectorAll('a[href], button:not([disabled])') || [])]
      .filter((element) => element.getClientRects().length)
    requestAnimationFrame(() => focusable()[0]?.focus())
    const onTab = (event) => {
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && (document.activeElement === first || !navRef.current?.contains(document.activeElement))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !navRef.current?.contains(document.activeElement))) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onTab)
    return () => {
      document.body.style.overflow = oldOverflow
      document.removeEventListener('keydown', onTab)
    }
  }, [menuOpen])

  useEffect(() => () => Object.values(hoverTimers.current).forEach(window.clearTimeout), [])

  return (
    <div className="public-site">
      <header className={`site-header${isScrolled ? ' is-scrolled' : ''}${isHome && isOverHero && !menuOpen ? ' is-over-hero' : ''}`}>
        <div className="site-header-inner">
          <Link className="brand" to="/" aria-label="VN Group home" onClick={closeMenu}>
            <img className="brand-image" src={siteContent.brand.logo.src} alt={siteContent.brand.logo.alt} />
            {isHome && siteContent.brand.lightLogo && <img className="brand-image brand-image-light" src={siteContent.brand.lightLogo.src} alt={siteContent.brand.lightLogo.alt} />}
          </Link>
          <button ref={menuButtonRef} className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="site-navigation" onClick={() => { setMenuOpen(!menuOpen); setOpenDropdown('') }}>
            <span className="sr-only">{menuOpen ? 'Close' : 'Open'} navigation menu</span>
            <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
          </button>
          <nav ref={navRef} id="site-navigation" className={`site-nav${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
            {dropdownGroups.map((group) => {
              const isOpen = openDropdown === group.id
              const isActive = group.id === 'about' ? location.pathname === '/about' : group.id === 'destinations' ? location.pathname.startsWith('/destinations') : group.id === 'resources' ? ['/journey', '/faqs', '/gallery'].includes(location.pathname) : location.hash.startsWith('#service-') || activeSection === 'services'
              return <div key={group.id} ref={(node) => { dropdownRefs.current[group.id] = node }} className={`about-nav${group.destination ? ' destinations-nav' : ''}${group.id === 'resources' ? ' resources-nav' : ''}${isOpen ? ' is-open' : ''}${isActive ? ' has-active-route' : ''}`} onMouseEnter={() => window.matchMedia('(min-width: 1024px)').matches && scheduleDropdown(group.id, 120, () => setOpenDropdown(group.id))} onMouseLeave={() => window.matchMedia('(min-width: 1024px)').matches && scheduleDropdown(group.id, 150, () => setOpenDropdown((value) => value === group.id ? '' : value))}>
                <button ref={(node) => { triggerRefs.current[group.id] = node }} type="button" className="about-trigger" aria-expanded={isOpen} aria-controls={`${group.id}-subnav`} onClick={() => setOpenDropdown((value) => value === group.id ? '' : group.id)}>
                  {group.label}<svg className="about-chevron" aria-hidden="true" viewBox="0 0 20 20"><path d="m5 7.5 5 5 5-5" /></svg>
                </button>
                <div id={`${group.id}-subnav`} className={`about-dropdown${group.destination ? ' destinations-dropdown' : ''}${group.id === 'services' ? ' services-dropdown' : ''}`} aria-label={group.label} aria-hidden={!isOpen}>
                  <ul>
                    {group.items.map((item) => <li key={item.label}>
                      <Link to={linkTo(item.to)} onClick={closeMenu}>
                        {group.icon && <NavIcon name={item.icon} />}
                        {group.destination && <CountryFlag code={item.code} name={item.label} size={20} />}
                        <span className="about-menu-copy"><strong>{item.label}</strong>{item.detail && <small>{item.detail}</small>}</span>
                      </Link>
                    </li>)}
                  </ul>
                  {group.destination && <Link className="view-destinations-link" to="/destinations" onClick={closeMenu}>View all destinations <span aria-hidden="true">→</span></Link>}
                </div>
              </div>
            })}
            <a href={isHome ? '#enquire' : '/#enquire'} onClick={closeMenu} className={`site-nav-link${location.pathname === '/contact' || activeSection === 'enquire' || location.hash === '#enquire' ? ' active' : ''}`}>Contact</a>
            <div className="site-nav-actions">
              <Link className="student-login-link" to={user ? '/portal' : '/login'} onClick={closeMenu} aria-label={user ? undefined : 'Login'}><svg aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="6.2" r="3"/><path d="M3.8 17c.4-3.3 2.5-5 6.2-5s5.8 1.7 6.2 5"/></svg>{user ? 'My account' : 'Login'}</Link>
              <a className="button button-small" href={`${isHome ? '' : '/'}#enquire`} onClick={closeMenu}>Free Counselling</a>
            </div>
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1} key={location.pathname}><Outlet /></main>
      <SiteFooter />
      <ChatWidget />
    </div>
  )
}

function Eyebrow({ children }) { return <p className="eyebrow">{children}</p> }
function PageIntro({ eyebrow, title, children }) {
  return <section className="page-intro"><Eyebrow>{eyebrow}</Eyebrow><h1>{title}</h1>{children && <p>{children}</p>}</section>
}
export function About() {
  const leadership = siteContent.leadership
  return <>
    <CeoMessage name={leadership.name} title={leadership.title} credentials={leadership.credentials} imageSrc={leadership.image.src} imageAlt={leadership.image.alt} message={leadership.message} />
    <AboutTimeline />
    <AboutPhotos />
  </>
}

function AboutTimeline() {
  const milestones = siteContent.about.timeline.filter((item) => Number.isFinite(Number(item.year)) && siteContentReady(item.title))
  if (!milestones.length) return null
  return <section className="about-timeline" aria-label="VN Group history">
    <div className="about-photo-container">
      <Eyebrow>Our journey</Eyebrow>
      <ol>{milestones.map((item) => <li key={`${item.year}-${item.title}`}><strong>{item.year}</strong><span>{item.title}</span></li>)}</ol>
    </div>
  </section>
}

function AboutPhotos() {
  return <div className="about-photo-content">
    <section className="about-institutions" aria-labelledby="about-institutions-title">
      <div className="about-photo-container about-institutions-grid">
        <ScrollReveal className="about-institutions-photo" direction="left">
          <ResponsiveImage image={siteImages.partnerMeeting} className="about-meeting-image" />
        </ScrollReveal>
        <ScrollReveal className="about-institutions-copy" direction="right" delay={100}>
          <Eyebrow>{siteContent.about.institutionsEyebrow}</Eyebrow>
          <h2 id="about-institutions-title">{siteContent.about.institutionsTitle}</h2>
          {siteContentReady(siteContent.about.institutionsCopy) && <p>{siteContent.about.institutionsCopy}</p>}
        </ScrollReveal>
      </div>
    </section>
    <section className="about-events" aria-labelledby="about-events-title">
      <ResponsiveImage image={siteImages.events} className="about-events-image" />
      <div className="about-events-overlay">
        <div className="about-photo-container">
          <ScrollReveal direction="fade-in">
            <Eyebrow>{siteContent.about.eventsEyebrow}</Eyebrow>
            <h2 id="about-events-title">{siteContent.about.eventsTitle}</h2>
          </ScrollReveal>
        </div>
      </div>
    </section>
  </div>
}

export function FAQs() { return <><PageIntro eyebrow="Questions" title={siteContent.pages.faqs.title}>{siteContent.pages.faqs.description}</PageIntro><FAQ variant="full" /></> }

export function Privacy() { return <LegalPage type="privacy" /> }

export function Contact() { return <><PageIntro eyebrow="Get in touch" title="Let's start with your questions." /><EnquirySection /></> }

export function NotFound() { return <PageIntro eyebrow="Page not found" title={<>Let's get you back <em>on track.</em></>}><>That page isn't available. Head back to the home page or explore the student journey.</><p><Link className="button" to="/">Return home</Link></p></PageIntro> }

