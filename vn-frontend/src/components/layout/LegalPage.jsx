import { siteContent, siteContentReady } from '../../data/siteContent'

export default function LegalPage({ type }) {
  const page = siteContent.legal[type]
  return <section className="legal-placeholder-page mx-auto max-w-3xl px-5 py-16 sm:px-8">
    <p className="data-eyebrow">VN Group Study Abroad</p>
    <h1>{page.title}</h1>
    {siteContentReady(page.body)
      ? <div className="legal-placeholder-copy">{page.body}</div>
      : <p>This page is being prepared. Please contact VN Group for the current policy before relying on it.</p>}
  </section>
}
