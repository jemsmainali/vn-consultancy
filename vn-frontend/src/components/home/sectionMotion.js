import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }

// Fade-up reveal in small staggered batches. Call inside a gsap.matchMedia() reduced-motion guard so
// the hidden state is reverted with it. Elements already scrolled past (deep links) reveal at once.
export function revealOnScroll(targets, { y = 40, stagger = 0.1, start = 'top 88%' } = {}) {
  const items = gsap.utils.toArray(targets)
  if (!items.length) return
  gsap.set(items, { opacity: 0, y })
  const reveal = (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger, overwrite: true, clearProps: 'opacity,transform' })
  ScrollTrigger.batch(items, { start, once: true, onEnter: reveal, onLeave: reveal, onEnterBack: reveal })
}
