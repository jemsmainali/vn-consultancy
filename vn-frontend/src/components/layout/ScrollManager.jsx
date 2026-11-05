import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

// Owns all route scrolling (the browser's own restoration races lazy pages and GSAP pin spacers):
// - PUSH/REPLACE without a hash: top of the page (smoothly when staying on the same page).
// - PUSH/REPLACE with a hash (a link the visitor clicked): that section.
// - POP (Back/Forward, reload): the position saved for that history entry.
// - First load with a hash and no saved position (a shared deep link): that section.
const STORAGE_KEY = 'vn-scroll-positions'
const positions = new Map()
try {
  Object.entries(JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}')).forEach(([key, y]) => positions.set(key, y))
} catch { /* storage unavailable: positions live for this page load only */ }

const persist = () => {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries([...positions].slice(-50)))) } catch { /* ignore */ }
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Retries each frame until `step` reports done, the time runs out or the visitor scrolls themselves.
function retry(step, timeout) {
  const started = performance.now()
  let frame = 0
  let stopped = false
  const stop = () => {
    stopped = true
    window.cancelAnimationFrame(frame)
    userEvents.forEach((name) => window.removeEventListener(name, stop))
  }
  const userEvents = ['wheel', 'touchstart', 'keydown', 'pointerdown']
  userEvents.forEach((name) => window.addEventListener(name, stop, { passive: true }))
  const tick = () => {
    if (stopped) return
    if (step() || performance.now() - started > timeout) stop()
    else frame = window.requestAnimationFrame(tick)
  }
  frame = window.requestAnimationFrame(tick)
  return stop
}

function restore(y) {
  let settled = 0
  return retry(() => {
    window.scrollTo({ top: y, behavior: 'instant' })
    // Lazy sections and pin spacers keep growing the page; wait until the position holds.
    settled = Math.abs(window.scrollY - y) < 2 ? settled + 1 : 0
    return settled >= 5
  }, 1500)
}

function scrollToHash(hash, smooth) {
  let id = hash.slice(1)
  try { id = decodeURIComponent(id) } catch { /* keep raw id */ }
  let found = 0
  return retry(() => {
    const target = document.getElementById(id)
    if (!target) return false
    found += 1
    // Scroll once when the section appears, then correct once more after late layout shifts.
    if (found === 1) target.scrollIntoView({ behavior: smooth && !reducedMotion() ? 'smooth' : 'instant' })
    if (found === 20 && !smooth) target.scrollIntoView({ behavior: 'instant' })
    return found >= 20
  }, 3000)
}

export default function ScrollManager() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const keyRef = useRef(location.key)
  const previousPath = useRef(null)

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        positions.set(keyRef.current, window.scrollY)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pagehide', persist)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', persist)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  useLayoutEffect(() => {
    const firstLoad = previousPath.current === null
    const samePage = previousPath.current === location.pathname
    previousPath.current = location.pathname
    keyRef.current = location.key
    persist()
    if (navigationType === 'POP') {
      const saved = positions.get(location.key)
      if (saved !== undefined) return restore(saved)
      if (firstLoad && location.hash) return scrollToHash(location.hash, false)
      return firstLoad ? undefined : restore(0)
    }
    if (location.hash) return scrollToHash(location.hash, samePage)
    window.scrollTo({ top: 0, behavior: samePage && !reducedMotion() ? 'smooth' : 'instant' })
    return undefined
  }, [location.key])

  return null
}
