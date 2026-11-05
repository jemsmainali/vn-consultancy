import { useEffect, useRef, useState } from 'react'
import '../../payment-notice.css'

const STORAGE_KEY = 'vn-payment-notice-seen'

// Shown once per browser session: warns visitors to pay only through VN Group's official channels.
export default function PaymentNotice() {
  const [open, setOpen] = useState(() => {
    try { return sessionStorage.getItem(STORAGE_KEY) !== '1' } catch { return true }
  })
  const buttonRef = useRef(null)

  const close = () => {
    try { sessionStorage.setItem(STORAGE_KEY, '1') } catch { /* storage blocked: notice simply closes */ }
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return undefined
    buttonRef.current?.focus()
    const onKey = (event) => { if (event.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null
  return <div className="payment-notice-backdrop" onClick={close}>
    <div className="payment-notice" role="dialog" aria-modal="true" aria-labelledby="payment-notice-title" onClick={(event) => event.stopPropagation()}>
      <p className="payment-notice-eyebrow">Important notice</p>
      <h2 id="payment-notice-title">Pay only through VN Group's official channels</h2>
      <p>Please make every payment directly through VN Group's official office and channels. Payments made to any other person or account are not valid.</p>
      <p lang="ne" className="payment-notice-ne">कृपया सबै भुक्तानी VN Group को आधिकारिक माध्यमबाट मात्र गर्नुहोस्। अन्य कुनै व्यक्ति वा खातामा गरिएको भुक्तानी मान्य हुने छैन।</p>
      <button ref={buttonRef} type="button" onClick={close}>I understand</button>
    </div>
  </div>
}
