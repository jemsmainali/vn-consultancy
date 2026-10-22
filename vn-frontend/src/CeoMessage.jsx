import './ceo-message.css'
import ScrollReveal from './ScrollReveal'
import { siteContent } from './data/siteContent'

export default function CeoMessage({
  name = siteContent.leadership.name,
  title = siteContent.leadership.title,
  credentials = '',
  imageSrc = siteContent.leadership.image.src,
  imageAlt = siteContent.leadership.image.alt,
  message = siteContent.leadership.message,
}) {
  const displayName = name?.trim() || 'VN Group CEO'

  return (
    <section id="leadership" className="ceo-message bg-cream px-5 py-16 text-ink sm:px-8 sm:py-20 lg:px-10 lg:py-24" aria-labelledby="ceo-heading">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[minmax(280px,0.82fr)_minmax(0,1.18fr)] lg:gap-20">
        <ScrollReveal delay={80} direction="left" className="mx-auto w-full max-w-[390px] lg:mx-0">
          <div className="ceo-portrait-scene w-full">
            <figure className="ceo-portrait-card relative isolate m-0 overflow-hidden rounded-2xl border border-gold/70 bg-white p-2.5 shadow-2xl shadow-navy/20 transition-transform duration-500 hover:-translate-y-2">
              <div className="overflow-hidden rounded-xl bg-navy/5">
                <img
                  className="ceo-portrait-image block aspect-[4/5] w-full object-cover object-[50%_22%]"
                  src={imageSrc}
                  alt={imageAlt || `Portrait of the ${title} at VN Group`}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <figcaption className="ceo-caption absolute inset-x-2.5 bottom-2.5 rounded-b-xl bg-gradient-to-t from-navy via-navy/95 to-navy/0 px-5 pb-5 pt-16 text-white sm:px-6 sm:pb-6">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Leadership</span>
                <strong className="block font-sans text-xl font-semibold leading-tight sm:text-2xl">{displayName}</strong>
                <span className="mt-1 block text-sm font-medium text-white/85">{title}</span>
                {credentials?.trim() && <span className="mt-2 block text-xs leading-relaxed text-white/70">{credentials}</span>}
              </figcaption>
            </figure>
            <span className="ceo-photo-note" aria-hidden="true">A clear path begins with a conversation</span>
          </div>
        </ScrollReveal>

        <div className="ceo-message-copy">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-gold">Leadership &amp; Vision</p>
          <h2 id="ceo-heading" className="max-w-2xl font-sans text-3xl font-semibold leading-[1.12] tracking-tight text-navy sm:text-4xl lg:text-[2.8rem]">
            Empowering Nepalese Students to Shape Global Futures.
          </h2>
          <div className="ceo-quote-mark mt-7 font-serif text-7xl leading-[0.75] text-gold" aria-hidden="true">“</div>
          <blockquote className="m-0 max-w-2xl border-l-2 border-gold pl-5 text-base leading-8 text-ink/80 sm:pl-7 sm:text-lg sm:leading-9">
            {message}
          </blockquote>
          <div className="mt-8 flex items-center gap-4">
            <span className="ceo-signature" aria-hidden="true">{name?.trim() || 'VN Group'}</span>
            <span className="h-10 w-px bg-gold/70" aria-hidden="true" />
            <span className="grid gap-1">
              <strong className="text-sm font-semibold text-navy">{displayName}</strong>
              <span className="text-xs text-ink/65">{title}</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
