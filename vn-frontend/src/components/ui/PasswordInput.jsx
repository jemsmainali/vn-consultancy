import { useState } from 'react'

export default function PasswordInput({ autoComplete = 'current-password', className = '', ...props }) {
  const [visible, setVisible] = useState(false)
  const label = visible ? 'Hide password' : 'Show password'

  return <span className="relative block">
    <input
      {...props}
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      className={`w-full rounded-lg border border-navy/20 bg-cream/60 px-3 py-2 pr-12 text-sm placeholder:text-navy/40 focus:border-navy focus:outline-none ${className}`}
    />
    <button
      type="button"
      className="absolute inset-y-0 right-1 my-auto grid h-10 w-10 place-items-center rounded-md text-navy/70 hover:bg-navy/5 focus-visible:ring-2 focus-visible:ring-gold"
      aria-label={label}
      aria-pressed={visible}
      onClick={() => setVisible((current) => !current)}
    >
      {visible
        ? <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.1 0 8.6 4.3 9.5 6.1a1.8 1.8 0 0 1 0 1.8 13.5 13.5 0 0 1-3 3.6M6.2 6.2a13.5 13.5 0 0 0-3.7 4.9 1.8 1.8 0 0 0 0 1.8A10.8 10.8 0 0 0 12 19a10.6 10.6 0 0 0 3.1-.5"/></svg>
        : <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2.5 12s3.4-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.4 6.5-9.5 6.5S2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>}
    </button>
  </span>
}
