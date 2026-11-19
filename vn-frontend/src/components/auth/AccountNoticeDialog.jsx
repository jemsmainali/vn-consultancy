import { useEffect, useRef } from 'react'
import '../../payment-notice.css'
import { paymentNotice } from '../../data/legalContent'

// Shown on every "Create account" click, after client validation and before anything is sent.
// Same layout as the site-wide notice (English and Nepali together). Continue runs onConfirm
// (the original submit); Cancel or Escape runs onCancel and sends nothing.
export default function AccountNoticeDialog({ open, onConfirm, onCancel }) {
  const dialogRef = useRef(null)
  const continueRef = useRef(null)
  // Latest onCancel, so a parent re-render does not re-run the open effect.
  const cancelRef = useRef(onCancel)
  cancelRef.current = onCancel

  useEffect(() => {
    if (!open) return undefined
    const returnFocus = document.activeElement
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    continueRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); cancelRef.current(); return }
      if (event.key !== 'Tab') return
      const items = [...dialogRef.current.querySelectorAll('button:not([disabled])')]
      const first = items[0]
      const last = items[items.length - 1]
      const inside = dialogRef.current.contains(document.activeElement)
      if (event.shiftKey && (document.activeElement === first || !inside)) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && (document.activeElement === last || !inside)) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = oldOverflow
      if (returnFocus instanceof HTMLElement && returnFocus.isConnected) returnFocus.focus()
    }
  }, [open])

  if (!open) return null
  return <div className="payment-notice-backdrop">
    <div ref={dialogRef} className="payment-notice account-notice" role="alertdialog" aria-modal="true" aria-labelledby="account-notice-title" aria-describedby="account-notice-en account-notice-ne">
      <p className="payment-notice-eyebrow">{paymentNotice.en.eyebrow}</p>
      <h2 id="account-notice-title">{paymentNotice.en.title}</h2>
      <p id="account-notice-en">{paymentNotice.en.body}</p>
      <p id="account-notice-ne" lang="ne" className="payment-notice-ne">{paymentNotice.ne.body}</p>
      <button ref={continueRef} type="button" onClick={onConfirm}>I understand and continue</button>
      <button type="button" className="account-notice-cancel" onClick={onCancel}>Cancel</button>
    </div>
  </div>
}
