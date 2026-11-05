import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../api'
import ScrollReveal from '../ScrollReveal'
import { fromManagedItem, galleryCategories, galleryPhotos } from '../data/galleryPhotos'

const gridSizes = '(max-width: 560px) calc(50vw - 26px), (max-width: 1024px) calc(33vw - 30px), 280px'

function GalleryTile({ photo, index, onOpen }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  if (failed) return null

  return (
    <ScrollReveal as="li" delay={(index % 4) * 80} className={`gallery-tile gallery-tile-${photo.category}${loaded ? ' is-loaded' : ''}`}>
      <button type="button" className="gallery-tile-button" onClick={() => onOpen(photo.id)} aria-label={`View larger: ${photo.caption}`}>
        <img
          src={photo.thumbSrc}
          srcSet={photo.srcSet}
          sizes={gridSizes}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          loading={index < 6 ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
        <span className="gallery-tile-caption" aria-hidden="true">
          <span className="gallery-tile-tag">{galleryCategories.find((item) => item.id === photo.category)?.label}</span>
          {photo.caption}
        </span>
        <span className="gallery-tile-zoom" aria-hidden="true">
          <svg viewBox="0 0 20 20"><circle cx="9" cy="9" r="5.5" /><path d="m13 13 4 4M9 6.5v5M6.5 9h5" /></svg>
        </span>
      </button>
    </ScrollReveal>
  )
}

function Lightbox({ photos, index, onClose, onMove }) {
  const closeRef = useRef(null)
  const touchStart = useRef(null)
  const photo = photos[index]

  useEffect(() => {
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      previousFocus?.focus?.()
    }
  }, [])

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
      else if (event.key === 'ArrowRight') onMove(1)
      else if (event.key === 'ArrowLeft') onMove(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onMove])

  if (!photo) return null

  return (
    <div
      className="gallery-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={photo.caption}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
      onTouchStart={(event) => { touchStart.current = event.touches[0].clientX }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return
        const distance = event.changedTouches[0].clientX - touchStart.current
        touchStart.current = null
        if (Math.abs(distance) > 50) onMove(distance < 0 ? 1 : -1)
      }}
    >
      <button ref={closeRef} type="button" className="gallery-lightbox-close" onClick={onClose} aria-label="Close photo viewer">×</button>
      {photos.length > 1 && <button type="button" className="gallery-lightbox-nav is-prev" onClick={() => onMove(-1)} aria-label="Previous photo">‹</button>}
      <figure className="gallery-lightbox-figure">
        <img key={photo.id} src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} />
        <figcaption><span>{photo.caption}</span><small>{index + 1} / {photos.length}</small></figcaption>
      </figure>
      {photos.length > 1 && <button type="button" className="gallery-lightbox-nav is-next" onClick={() => onMove(1)} aria-label="Next photo">›</button>}
    </div>
  )
}

export default function Gallery() {
  const [filter, setFilter] = useState('all')
  const [openId, setOpenId] = useState(null)
  const [managed, setManaged] = useState([])
  const allPhotos = [...galleryPhotos.slice(0, 4), ...managed, ...galleryPhotos.slice(4)]
  const visible = filter === 'all' ? allPhotos : allPhotos.filter((photo) => photo.category === filter)
  const openIndex = visible.findIndex((photo) => photo.id === openId)
  const visaCount = allPhotos.filter((photo) => photo.category === 'visa').length

  useEffect(() => {
    // Only published items come back from the public endpoint; the static set still renders if it fails.
    const controller = new AbortController()
    fetch(`${API_BASE}/gallery`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : []))
      .then((items) => setManaged(Array.isArray(items) ? items.map((item) => fromManagedItem(item, API_BASE)) : []))
      .catch(() => {})
    return () => controller.abort()
  }, [])

  const close = useCallback(() => setOpenId(null), [])
  const move = useCallback((step) => {
    setOpenId((current) => {
      const position = visible.findIndex((photo) => photo.id === current)
      if (position < 0) return current
      return visible[(position + step + visible.length) % visible.length].id
    })
  }, [visible])

  return <>
    <section className="page-intro gallery-intro">
      <p className="eyebrow">Gallery</p>
      <h1>Moments from our <em>students' journeys.</em></h1>
      <p>Visa approvals, airport send-offs and visits with our partner institutions — a look at the students and team behind VN Group.</p>
      <dl className="gallery-stats">
        <div><dt>Visa success stories</dt><dd>{visaCount}+</dd></div>
        <div><dt>Photos</dt><dd>{allPhotos.length}</dd></div>
      </dl>
    </section>

    <section className="gallery-section" aria-label="Photo gallery">
      <div className="gallery-filters" role="group" aria-label="Filter photos">
        {galleryCategories.map((category) => {
          const count = category.id === 'all' ? allPhotos.length : allPhotos.filter((photo) => photo.category === category.id).length
          return <button key={category.id} type="button" className={`gallery-filter${filter === category.id ? ' is-active' : ''}`} aria-pressed={filter === category.id} onClick={() => setFilter(category.id)}>
            {category.label}<span>{count}</span>
          </button>
        })}
      </div>

      <ul key={filter} className="gallery-grid">
        {visible.map((photo, index) => <GalleryTile key={photo.id} photo={photo} index={index} onOpen={setOpenId} />)}
      </ul>

      <div className="gallery-cta">
        <div>
          <h2>Your photo could be next.</h2>
          <p>Book a free counselling session and start planning your study abroad journey.</p>
        </div>
        <Link className="button glow-cta" to="/#enquire">Free Counselling</Link>
      </div>
    </section>

    {openIndex >= 0 && <Lightbox photos={visible} index={openIndex} onClose={close} onMove={move} />}
  </>
}
