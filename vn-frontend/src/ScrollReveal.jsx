import { useLayoutEffect, useRef, useState } from 'react'

const revealCallbacks = new Map()
let sharedObserver = null

function observeOnce(target, onReveal) {
  if (typeof IntersectionObserver === 'undefined') return null

  try {
    if (!sharedObserver) {
      sharedObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const reveal = revealCallbacks.get(entry.target)
          if (!reveal) return
          revealCallbacks.delete(entry.target)
          observer.unobserve(entry.target)
          reveal()
        })
        if (revealCallbacks.size === 0) {
          observer.disconnect()
          if (sharedObserver === observer) sharedObserver = null
        }
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })
    }

    const observer = sharedObserver
    revealCallbacks.set(target, onReveal)
    observer.observe(target)
    return () => {
      revealCallbacks.delete(target)
      observer.unobserve(target)
      if (revealCallbacks.size === 0) {
        observer.disconnect()
        if (sharedObserver === observer) sharedObserver = null
      }
    }
  } catch {
    revealCallbacks.delete(target)
    const observer = sharedObserver
    try { observer?.unobserve(target) } catch { /* Failed observers must not hide content. */ }
    if (revealCallbacks.size === 0 && observer) {
      try { observer.disconnect() } catch { /* Ignore observer cleanup failures. */ }
      if (sharedObserver === observer) sharedObserver = null
    }
    return null
  }
}

function motionIsReduced() {
  return typeof window === 'undefined'
    || typeof window.matchMedia !== 'function'
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function ScrollReveal({
  as: Element = 'div',
  children,
  delay = 0,
  duration = 600,
  direction = 'fade-up',
  className = '',
  ...props
}) {
  const elementRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isArmed, setIsArmed] = useState(false)

  useLayoutEffect(() => {
    const target = elementRef.current
    if (!target || motionIsReduced() || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return undefined
    }

    const bounds = target.getBoundingClientRect()
    const alreadyInView = bounds.top < window.innerHeight
      && bounds.bottom > 0
      && bounds.left < window.innerWidth
      && bounds.right > 0
    if (alreadyInView) {
      setIsVisible(true)
      return undefined
    }

    const cleanup = observeOnce(target, () => setIsVisible(true))
    if (!cleanup) {
      setIsVisible(true)
      return undefined
    }

    setIsArmed(true)
    return cleanup
  }, [])

  const safeDelay = Math.max(0, Number(delay) || 0)
  const numericDuration = Number(duration)
  const safeDuration = Number.isFinite(numericDuration) ? Math.max(0, numericDuration) : 600
  const hidden = isArmed && !isVisible

  return (
    <Element
      ref={elementRef}
      className={`reveal${hidden ? ' reveal-hidden' : ''}${className ? ` ${className}` : ''}`}
      data-reveal-direction={direction}
      style={{ transitionDuration: `${safeDuration}ms`, transitionDelay: isVisible ? `${safeDelay}ms` : '0ms' }}
      {...props}
    >
      {children}
    </Element>
  )
}
