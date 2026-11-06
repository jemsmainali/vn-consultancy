import { useCallback, useEffect, useState } from 'react'
import { API_BASE } from '../api'
import ScrollReveal from '../ScrollReveal'
import PhotoLightbox from '../components/ui/PhotoLightbox'
import { fromManagedItem, galleryCategories, galleryPhotos, galleryTagFor } from '../data/galleryPhotos'

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
          <span className="gallery-tile-tag">{galleryTagFor(photo)}</span>
          {photo.caption}
        </span>
        <span className="gallery-tile-zoom" aria-hidden="true">
          <svg viewBox="0 0 20 20"><circle cx="9" cy="9" r="5.5" /><path d="m13 13 4 4M9 6.5v5M6.5 9h5" /></svg>
        </span>
      </button>
    </ScrollReveal>
  )
}

export default function Gallery() {
  const [filter, setFilter] = useState('all')
  const [openId, setOpenId] = useState(null)
  const [managed, setManaged] = useState([])
  const allPhotos = [...galleryPhotos.slice(0, 4), ...managed, ...galleryPhotos.slice(4)]
  // Filters with no photos (e.g. UK until posters are added) are not shown.
  const filters = galleryCategories
    .map((category) => ({ ...category, count: allPhotos.filter(category.match).length }))
    .filter((category) => category.id === 'all' || category.count > 0)
  const activeFilter = filters.find((category) => category.id === filter) || filters[0]
  const visible = allPhotos.filter(activeFilter.match)
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
        {filters.map((category) => <button key={category.id} type="button" className={`gallery-filter${activeFilter.id === category.id ? ' is-active' : ''}`} aria-pressed={activeFilter.id === category.id} onClick={() => setFilter(category.id)}>
          {category.label}<span>{category.count}</span>
        </button>)}
      </div>

      <ul key={activeFilter.id} className="gallery-grid">
        {visible.map((photo, index) => <GalleryTile key={photo.id} photo={photo} index={index} onOpen={setOpenId} />)}
      </ul>
    </section>

    {openIndex >= 0 && <PhotoLightbox photos={visible} index={openIndex} onClose={close} onMove={move} />}
  </>
}
