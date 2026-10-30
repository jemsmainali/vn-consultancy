import { useState } from 'react'

export default function ResponsiveImage({ image, className = '', loading = 'lazy', fetchPriority, objectPosition, onUnavailable, ...props }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  if (!image || failed) return null

  const handleError = () => {
    setFailed(true)
    onUnavailable?.()
  }

  return (
    <picture className={`responsive-image${loaded ? ' is-loaded' : ''}${className ? ` ${className}` : ''}`}>
      <source type="image/webp" srcSet={image.webpSrcSet} sizes={image.sizes} />
      <img
        src={image.src || image.webpSrc}
        alt={image.alt}
        width={image.width}
        height={image.height}
        loading={loading}
        decoding="async"
        {...(fetchPriority ? { fetchpriority: fetchPriority } : {})}
        style={objectPosition ? { objectPosition } : undefined}
        onLoad={() => setLoaded(true)}
        onError={handleError}
        {...props}
      />
    </picture>
  )
}
