import { useEffect, useRef, useState } from 'react'
import { siteContent } from '../../data/siteContent'
import { siteContentReady } from '../../data/siteContent'

function Stat({ value, label, suffix = '' }) {
  const element = useRef(null)
  const [shown, setShown] = useState(0)

  useEffect(() => {
    const target = Number(value)
    if (!Number.isFinite(target)) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      setShown(target)
      return undefined
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const start = performance.now()
      const animate = (now) => {
        const progress = Math.min(1, (now - start) / 900)
        setShown(Math.round(target * progress))
        if (progress < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    }, { threshold: 0.5 })
    if (element.current) observer.observe(element.current)
    return () => observer.disconnect()
  }, [value])

  return <div ref={element} className="trust-stat"><strong>{shown.toLocaleString()}{suffix}</strong><span>{label}</span></div>
}

export default function TrustStrip() {
  const stats = siteContent.home.stats.filter((item) => item.value !== null && item.value !== undefined && item.value !== '' && Number.isFinite(Number(item.value)) && siteContentReady(item.label))
  if (!stats.length) return null
  return <section className="trust-stats" aria-label="VN Group at a glance">
    <div className="data-container trust-stats-grid">
      {stats.map((item) => <Stat key={item.label} {...item} />)}
    </div>
  </section>
}
