import { useEffect, useRef, useState } from 'react'
import '../../payment-notice.css'
import { paymentNotice } from '../../data/legalContent'

const LANGUAGES = [
  { id: 'en', label: 'EN' },
  { id: 'ne', label: 'नेपाली' },
]

// Shown on every "Create account" click, after client validation and before anything is sent.
// Continue runs onConfirm (the original submit); Cancel or Escape runs onCancel and sends nothing.
export default function AccountNoticeDialog({ open, onConfirm, onCancel }) {
  const [language, setLanguage] = useState('en')
  const dialogRef = useRef(null)
  // Latest onCancel, so a parent re-render does not re-run the open effect (focus, language).
  const cancelRef = useRef(onCancel)
  cancelRef.current = onCancel

  useEffect(() => {
    if (!open) return undefined
    setLanguage('en')
    const returnFocus = document.activeElement
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); cancelRef.current(); return }
      if (event.key !== 'Tab') return
      const items = [...dialogRef.current.querySelectorAll('button:not([disabled])')]
      const first = items[0]
      const last = items[items.length - 1]
      const inside = dialogRef.current.contains(document.activeElement)
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current || !inside)) {
        event.preventDefault(); last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !inside)) {
        event.preventDefault(); first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = oldOverflow
      if (returnFocus instanceof HTMLElement && returnFocus.isConnected) returnFocus.focus()
    }
  }, [open])

  if (!open) return null
  const nepali = language === 'ne'
  return <div className="payment-notice-backdrop">
    <div ref={dialogRef} className="payment-notice account-notice" role="alertdialog" aria-modal="true" aria-labelledby="account-notice-title" aria-describedby="account-notice-body" tabIndex={-1}>
      <div className="account-notice-head">
        <p className="payment-notice-eyebrow">{paymentNotice.en.eyebrow}</p>
        <div className="account-notice-lang" role="group" aria-label="Notice language">
          {LANGUAGES.map((item) => <button key={item.id} type="button" lang={item.id} aria-pressed={language === item.id} onClick={() => setLanguage(item.id)}>{item.label}</button>)}
        </div>
      </div>
      <h2 id="account-notice-title">{paymentNotice.en.title}</h2>
      <p id="account-notice-body" lang={nepali ? 'ne' : 'en'}>{nepali ? paymentNotice.ne.body : paymentNotice.en.body}</p>
      <div className="account-notice-actions">
        <button type="button" className="account-notice-cancel" onClick={onCancel}>Cancel</button>
        <button type="button" onClick={onConfirm}>I understand and continue</button>
      </div>
    </div>
  </div>
}
