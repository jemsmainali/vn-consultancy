import { useCallback, useState } from 'react'
import './ceo-message.css'
import ResponsiveImage from './ResponsiveImage'
import PhotoLightbox from './components/ui/PhotoLightbox'
import { formatMonthYear, partnerVisitsWithPhotos, siteContent } from './data/siteContent'

const fillPlaceholders = (text, values) => text.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match)

const albumPhotos = () => partnerVisitsWithPhotos().map((visit) => ({
  id: visit.title,
  // Largest WebP for the viewer; the JPEG fallback when an image has no WebP set.
  src: visit.image.webpSrcSet?.split(', ').at(-1).split(' ')[0] || visit.image.src,
  thumb: visit.image,
  alt: visit.image.alt,
  caption: [visit.title, visit.place, visit.date && formatMonthYear(visit.date)].filter(Boolean).join(' · '),
}))

// "Folder" of photos beside the message: three stacked previews and a count; opens the photo viewer.
function PhotoFolder({ title }) {
  const [photos] = useState(albumPhotos)
  const [openIndex, setOpenIndex] = useState(-1)
  const close = useCallback(() => setOpenIndex(-1), [])
  const move = useCallback((step) => setOpenIndex((index) => (index + step + photos.length) % photos.length), [photos.length])
  if (!photos.length) return null
  return <>
    <button type="button" className="ceo-folder" onClick={() => setOpenIndex(0)}>
      <span className="ceo-folder-stack" aria-hidden="true">
        {photos.slice(0, 3).map((photo) => <ResponsiveImage key={photo.id} image={{ ...photo.thumb, sizes: '96px' }} alt="" />)}
      </span>
      <span className="ceo-folder-copy">
        <strong>{title}</strong>
        <span>{photos.length} photos · See all</span>
      </span>
    </button>
    {openIndex >= 0 && <PhotoLightbox photos={photos} index={openIndex} onClose={close} onMove={move} />}
  </>
}

// Editorial "Message from our Managing Director". Render only when about.ceoMessageApproved is true.
export default function CeoMessage({ about = siteContent.about }) {
  const { ceoName, ceoTitle, ceoPhoto } = about
  const [photoAvailable, setPhotoAvailable] = useState(Boolean(ceoPhoto))
  const message = fillPlaceholders(about.ceoMessage, { foundedYear: siteContent.brand.foundedYear })

  return (
    <section id="leadership" className="ceo-message" aria-labelledby="ceo-heading">
      <div className={`ceo-message-inner${photoAvailable ? '' : ' is-text-only'}`}>
        <div className="ceo-message-side">
          {photoAvailable && (
            <figure className="ceo-message-portrait">
              <ResponsiveImage image={ceoPhoto} onUnavailable={() => setPhotoAvailable(false)} />
            </figure>
          )}
          <PhotoFolder title={about.ceoAlbumTitle} />
        </div>
        <div className="ceo-message-copy">
          <p className="eyebrow">Leadership</p>
          <h2 id="ceo-heading">Message from our {ceoTitle}</h2>
          <blockquote className="ceo-message-text">
            <p>{message}</p>
          </blockquote>
          <p className="ceo-message-sign">
            <strong>{ceoName}</strong>
            <span>{ceoTitle}, VN Group</span>
          </p>
        </div>
      </div>
    </section>
  )
}
