import { useState } from 'react'
import './ceo-message.css'
import ResponsiveImage from './ResponsiveImage'
import { siteContent } from './data/siteContent'

const fillPlaceholders = (text, values) => text.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match)

// Editorial "Message from our Managing Director". Render only when about.ceoMessageApproved is true.
export default function CeoMessage({ about = siteContent.about }) {
  const { ceoName, ceoTitle, ceoPhoto } = about
  const [photoAvailable, setPhotoAvailable] = useState(Boolean(ceoPhoto))
  const message = fillPlaceholders(about.ceoMessage, { foundedYear: siteContent.brand.foundedYear })

  return (
    <section id="leadership" className="ceo-message" aria-labelledby="ceo-heading">
      <div className={`ceo-message-inner${photoAvailable ? '' : ' is-text-only'}`}>
        {photoAvailable && (
          <figure className="ceo-message-portrait">
            <ResponsiveImage image={ceoPhoto} onUnavailable={() => setPhotoAvailable(false)} />
          </figure>
        )}
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
