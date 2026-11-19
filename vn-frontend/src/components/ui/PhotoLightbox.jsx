import { useEffect, useRef } from 'react'

// Full-screen photo viewer (gallery and the About page photo folder). Photos need id, src, alt, caption.
export default function PhotoLightbox({ photos, index, onClose, onMove }) {
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
