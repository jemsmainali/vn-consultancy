import { useEffect, useRef, useState } from 'react'
import '../../payment-notice.css'
import { paymentNotice } from '../../data/legalContent'

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
      <p className="payment-notice-eyebrow">{paymentNotice.en.eyebrow}</p>
      <h2 id="payment-notice-title">{paymentNotice.en.title}</h2>
      <p>{paymentNotice.en.body}</p>
      <p lang="ne" className="payment-notice-ne">{paymentNotice.ne.body}</p>
      <button ref={buttonRef} type="button" onClick={close}>I understand</button>
    </div>
  </div>
}
