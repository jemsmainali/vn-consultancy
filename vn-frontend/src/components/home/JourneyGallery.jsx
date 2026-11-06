import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { API_BASE } from '../../api'
import { fromManagedItem, galleryPreview, galleryTagFor } from '../../data/galleryPhotos'

gsap.registerPlugin(ScrollTrigger)

const PIN_QUERY = '(min-width: 900px) and (prefers-reduced-motion: no-preference)'

// Threads a smooth curve through every card's dot, measured from the live layout.
function buildJourneyPath(track, svg, path) {
  const dots = [...track.querySelectorAll('.journey-card-dot')]
  const width = track.scrollWidth
  const height = track.offsetHeight
  if (!dots.length || !width || !height) return 0
  const origin = track.getBoundingClientRect()
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  svg.style.width = `${width}px`
  svg.style.height = `${height}px`
  const points = dots.map((dot) => {
    const box = dot.getBoundingClientRect()
    return [box.left - origin.left + box.width / 2, box.top - origin.top + box.height / 2]
  })
  let [px, py] = [0, points[0][1]]
  let d = `M ${px} ${py}`
  for (const [x, y] of [...points, [width, points[points.length - 1][1]]]) {
    const mid = (px + x) / 2
    d += ` C ${mid} ${py}, ${mid} ${y}, ${x} ${y}`
    ;[px, py] = [x, y]
  }
  svg.querySelectorAll('path').forEach((item) => item.setAttribute('d', d))
  const length = path.getTotalLength()
  path.style.strokeDasharray = `${length}`
  return length
}

function JourneyCard({ photo, index, onReady }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return <li className="journey-card">
    <span className="journey-card-dot" aria-hidden="true" />
    <Link to="/gallery" className="journey-card-link" aria-label={`Open gallery: ${photo.caption}`}>
      <span className="journey-card-media">
        <img src={photo.thumbSrc} srcSet={photo.srcSet} sizes="(max-width: 899px) 70vw, 320px" alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" decoding="async" onLoad={onReady} onError={() => { setFailed(true); onReady() }} />
      </span>
      <span className="journey-card-body">
        <span className="journey-card-meta"><span className="journey-card-step">{String(index + 1).padStart(2, '0')}</span><span className="journey-card-tag">{galleryTagFor(photo)}</span></span>
        <strong>{photo.caption}</strong>
      </span>
    </Link>
  </li>
}

export default function JourneyGallery() {
  const sectionRef = useRef(null)
  const viewportRef = useRef(null)
  const trackRef = useRef(null)
  const svgRef = useRef(null)
  const pathRef = useRef(null)
  const refreshTimer = useRef(0)
  const [managed, setManaged] = useState([])
  const photos = [...galleryPreview, ...managed]

  useEffect(() => {
    // Published staff items only; the static photos still render if the API is unavailable.
    const controller = new AbortController()
    fetch(`${API_BASE}/gallery`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : []))
      .then((items) => setManaged(Array.isArray(items) ? items.slice(0, 4).map((item) => fromManagedItem(item, API_BASE)) : []))
      .catch(() => {})
    return () => { controller.abort(); window.clearTimeout(refreshTimer.current) }
  }, [])

  // Images settle card sizes as they load; batch those into one refresh.
  const scheduleRefresh = () => {
    window.clearTimeout(refreshTimer.current)
    refreshTimer.current = window.setTimeout(() => ScrollTrigger.refresh(), 150)
  }

  useLayoutEffect(() => {
    const section = sectionRef.current
    const viewport = viewportRef.current
    const track = trackRef.current
    const svg = svgRef.current
    const path = pathRef.current
    if (!section || !viewport || !track || !svg || !path) return undefined

    let ctx = null
    let frame = 0
    let attempts = 0
    let resizeObserver = null
    let cancelled = false

    const init = () => {
      if (cancelled) return
      // Wait until layout has measurable dimensions before creating triggers.
      if ((!track.scrollWidth || !viewport.clientWidth) && attempts++ < 30) {
        frame = requestAnimationFrame(init)
        return
      }
      ctx = gsap.context(() => {
        const mm = gsap.matchMedia()

        mm.add(PIN_QUERY, () => {
          // Pin below the sticky site header so the heading is never covered.
          const headerOffset = () => document.querySelector('.site-header')?.offsetHeight || 0
          const syncOffset = () => section.style.setProperty('--journey-offset', `${headerOffset()}px`)
          syncOffset()
          let length = buildJourneyPath(track, svg, path)
          const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth)
          const slide = gsap.to(track, {
            x: () => -distance(),
            ease: 'none',
            // Driven by the scrubbed tween so the line stays in step with the smoothed slide.
            onUpdate() {
              path.style.strokeDashoffset = `${length * (1 - this.progress())}`
              section.style.setProperty('--journey-progress', this.progress().toFixed(3))
            },
            scrollTrigger: {
              trigger: section,
              start: () => `top ${headerOffset()}`,
              end: () => `+=${distance()}`,
              pin: true,
              scrub: 0.6,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onRefreshInit: () => { syncOffset(); length = buildJourneyPath(track, svg, path) },
            },
          })
          path.style.strokeDashoffset = `${length}`

          track.querySelectorAll('.journey-card').forEach((card) => {
            const img = card.querySelector('img')
            if (img) {
              gsap.fromTo(img, { scale: 1.12 }, {
                scale: 1,
                ease: 'none',
                scrollTrigger: { trigger: card, containerAnimation: slide, start: 'left right', end: 'center center', scrub: true },
              })
            }
            gsap.fromTo(card.querySelector('.journey-card-link, .journey-end'), { opacity: 0.4, y: 24 }, {
              opacity: 1,
              y: 0,
              ease: 'power2.out',
              scrollTrigger: { trigger: card, containerAnimation: slide, start: 'left 95%', end: 'left 65%', scrub: true },
            })
          })

          return () => {
            path.style.strokeDashoffset = ''
            section.style.removeProperty('--journey-progress')
            section.style.removeProperty('--journey-offset')
          }
        })

        // Small screens and reduced motion: native swipe scroller; the line follows that scroll.
        mm.add(`not all and ${PIN_QUERY}`, () => {
          const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
          let length = buildJourneyPath(track, svg, path)
          const sync = () => {
            const max = viewport.scrollWidth - viewport.clientWidth
            const progress = reduced || max <= 0 ? 1 : Math.min(1, 0.12 + (viewport.scrollLeft / max) * 0.88)
            path.style.strokeDashoffset = `${length * (1 - progress)}`
            section.style.setProperty('--journey-progress', progress.toFixed(3))
          }
          const rebuild = () => { length = buildJourneyPath(track, svg, path); sync() }
          sync()
          viewport.addEventListener('scroll', sync, { passive: true })
          window.addEventListener('resize', rebuild)
          return () => {
            viewport.removeEventListener('scroll', sync)
            window.removeEventListener('resize', rebuild)
            path.style.strokeDashoffset = ''
            section.style.removeProperty('--journey-progress')
          }
        })
      }, section)

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(scheduleRefresh)
        resizeObserver.observe(viewport)
      }
    }

    frame = requestAnimationFrame(init)
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      window.clearTimeout(refreshTimer.current)
      resizeObserver?.disconnect()
      ctx?.revert()
    }
  }, [managed.length])

  if (!photos.length) return null

  return <section ref={sectionRef} id="gallery-preview" className="journey-gallery" aria-labelledby="journey-gallery-title">
    <div className="journey-gallery-inner">
      <header className="journey-gallery-head">
        <div>
          <p className="data-eyebrow">Student gallery</p>
          <h2 id="journey-gallery-title">Moments from our students' journeys</h2>
        </div>
        <div className="journey-gallery-aside">
          <p>Visa approvals, airport send-offs and life at VN Group.</p>
          <div className="journey-progress" aria-hidden="true"><span /></div>
        </div>
      </header>
      <div ref={viewportRef} className="journey-viewport" tabIndex={0} role="region" aria-label="Gallery photos, scroll sideways for more">
        <div ref={trackRef} className="journey-track">
          <svg ref={svgRef} className="journey-line" aria-hidden="true" focusable="false">
            <path className="journey-line-base" d="M0 0" />
            <path ref={pathRef} className="journey-line-draw" d="M0 0" />
          </svg>
          <ol className="journey-list">
            {photos.map((photo, index) => <JourneyCard key={photo.id} photo={photo} index={index} onReady={scheduleRefresh} />)}
            <li className="journey-card journey-card-end">
              <span className="journey-card-dot" aria-hidden="true" />
              <div className="journey-end">
                <span className="journey-end-icon" aria-hidden="true">✈</span>
                <strong>Your journey could be next.</strong>
                <Link className="home-button" to="/gallery">View the full gallery</Link>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </div>
  </section>
}
