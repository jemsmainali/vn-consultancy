import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { siteContent, siteContentReady } from '../../data/siteContent'

export default function WhatsAppButton() {
  const [overlap, setOverlap] = useState(false)
  const location = useLocation()
  const { whatsappNumber, whatsappMessage } = siteContent.contact
  const digits = siteContentReady(whatsappNumber) ? whatsappNumber.replace(/\D/g, '') : ''

  useEffect(() => {
    setOverlap(false)
    if (!digits || !('IntersectionObserver' in window)) return undefined
    const coveredAreas = [...document.querySelectorAll('form, .site-footer')]
    const visible = new Set()
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target))
      setOverlap(visible.size > 0)
    }, { threshold: 0.08 })
    coveredAreas.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [digits, location.key])

  if (!digits || digits.length < 8 || digits.length > 15) return null
  const message = siteContentReady(whatsappMessage) ? whatsappMessage : 'Hello, I would like to ask about study abroad guidance.'
  return <a className={`whatsapp-float${overlap ? ' is-obscured' : ''}`} href={`https://wa.me/${digits}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" aria-label="Chat with VN Group on WhatsApp">
    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12.04 2a9.8 9.8 0 0 0-8.37 14.9L2.4 22l5.27-1.22A9.9 9.9 0 1 0 12.04 2Zm0 17.98a8 8 0 0 1-4.08-1.12l-.29-.17-3.13.73.75-3.05-.19-.31a8.06 8.06 0 1 1 6.94 3.92Zm4.42-6.04c-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.39-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.51.1.46-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z"/></svg>
  </a>
}
