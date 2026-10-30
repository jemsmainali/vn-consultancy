import { Link } from 'react-router-dom'
import ResponsiveImage from '../../ResponsiveImage'
import { siteContent, siteImages } from '../../data/siteContent'

const asideImage = { ...siteImages.counselling, sizes: '(max-width: 1023px) 100vw, 46vw' }

function CheckMark() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="m5 10.5 3.2 3L15 6.5" /></svg>
}

export function AuthAside({ eyebrow, title, description, points = [] }) {
  return (
    <aside className="auth-aside" aria-label="About VN Group">
      <ResponsiveImage image={asideImage} className="auth-aside-photo" loading="eager" fetchPriority="high" alt="" />
      <div className="auth-aside-content">
        <p className="auth-aside-eyebrow"><span aria-hidden="true" />{eyebrow}</p>
        <div className="auth-aside-copy">
          <p className="auth-aside-title">{title}</p>
          {description && <p className="auth-aside-description">{description}</p>}
          {points.length > 0 && (
            <ul className="auth-aside-points">
              {points.map((point) => <li key={point}><CheckMark />{point}</li>)}
            </ul>
          )}
        </div>
      </div>
    </aside>
  )
}

export default function AuthLayout({ variant = 'login', aside, children }) {
  return (
    <div className={`auth-page auth-page--${variant}`}>
      {aside}
      <main id="main" tabIndex={-1} className="auth-main">
        <header className="auth-topbar">
          <Link to="/" className="auth-logo-link" aria-label={`${siteContent.brand.name} home`}>
            <img src={siteContent.brand.logo.src} alt="" className="auth-logo" width="176" height="74" />
          </Link>
          <Link to="/" className="auth-back-link">
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M11.5 5 6.5 10l5 5" /></svg>
            Back to website
          </Link>
        </header>
        <div className={`auth-panel auth-panel--${variant}`}>{children}</div>
      </main>
    </div>
  )
}
