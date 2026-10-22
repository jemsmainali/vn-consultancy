import { useEffect, useRef, useState } from 'react'

export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  danger = false, onConfirm, onCancel,
}) {
  const cancelRef = useRef(null)
  const restoreRef = useRef(null)
  const busyRef = useRef(false)
  const callbacksRef = useRef({ onCancel, onConfirm })
  const [busy, setBusy] = useState(false)
  callbacksRef.current = { onCancel, onConfirm }

  useEffect(() => {
    if (!open) return undefined
    restoreRef.current = document.activeElement
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cancelRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busyRef.current) { event.preventDefault(); callbacksRef.current.onCancel() }
      if (event.key !== 'Tab') return
      const buttons = [...document.querySelectorAll('[data-confirm-dialog] button:not(:disabled)')]
      if (!buttons.length) return
      const first = buttons[0]
      const last = buttons[buttons.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = oldOverflow
      document.removeEventListener('keydown', onKeyDown)
      if (restoreRef.current?.isConnected) restoreRef.current.focus()
    }
  }, [open])

  if (!open) return null
  const confirm = async () => {
    if (busy) return
    busyRef.current = true
    setBusy(true)
    try { await callbacksRef.current.onConfirm() } finally { busyRef.current = false; setBusy(false) }
  }

  return <div className="confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel() }}>
    <section data-confirm-dialog role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message" className="confirm-dialog">
      <h2 id="confirm-dialog-title">{title}</h2>
      <p id="confirm-dialog-message">{message}</p>
      <div className="confirm-dialog-actions">
        <button ref={cancelRef} type="button" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
        <button type="button" className={danger ? 'is-danger' : ''} onClick={confirm} disabled={busy}>{busy ? 'Working…' : confirmLabel}</button>
      </div>
    </section>
  </div>
}
