import { Children, cloneElement, isValidElement, useId } from 'react'

// Wires the label, hint and error text to the single control passed as children.
export default function AuthField({ label, hint, error, optional = false, span = false, children }) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined
  const control = Children.only(children)

  return (
    <div className={`auth-field${span ? ' auth-field--span' : ''}`}>
      <label className="auth-label" htmlFor={id}>
        {label}
        {optional && <span className="auth-optional">Optional</span>}
      </label>
      {isValidElement(control) && cloneElement(control, {
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })}
      {error && <p id={errorId} className="auth-field-error">{error}</p>}
      {hint && <p id={hintId} className="auth-hint">{hint}</p>}
    </div>
  )
}
