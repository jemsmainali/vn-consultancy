import { useLayoutEffect, useRef, useState } from 'react'

// Counts up once when scrolled into view. Renders the final value without motion support.
export default function CountUp({ value, suffix = '', duration = 1100 }) {
  const ref = useRef(null)
  const [display, setDisplay] = useState(value)

  useLayoutEffect(() => {
    const node = ref.current
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!node || reduced || typeof IntersectionObserver === 'undefined') return undefined
    setDisplay(0)
    let frame = 0
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const start = performance.now()
      const tick = (now) => {
        const progress = Math.min(1, (now - start) / duration)
        setDisplay(Math.round(value * (1 - (1 - progress) ** 3)))
        if (progress < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }, { threshold: 0.6 })
    observer.observe(node)
    return () => { observer.disconnect(); cancelAnimationFrame(frame) }
  }, [value, duration])

  return <span ref={ref} aria-label={`${value}${suffix}`}><span aria-hidden="true">{display}{suffix}</span></span>
}
