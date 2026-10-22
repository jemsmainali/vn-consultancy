import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { Logo, Input, Btn, Err } from '../ui'
import { siteContent, siteContentReady, siteImages } from '../data/siteContent'
import PasswordInput from '../components/ui/PasswordInput'

const { contact } = siteContent
const supportNumber = siteContentReady(contact.phone) ? contact.phone : ''
const whatsappNumber = siteContentReady(contact.whatsappNumber) ? contact.whatsappNumber.replace(/\D/g, '') : ''
const supportEmail = siteContentReady(contact.email) ? contact.email : ''

function ContactIcon({ type }) {
  if (type === 'Call') {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 3.75h3l1.5 4.5-2 1.5a15 15 0 0 0 7.25 7.25l1.5-2 4.5 1.5v3c0 .83-.67 1.5-1.5 1.5A16.5 16.5 0 0 1 3 5.25c0-.83.67-1.5 1.5-1.5Z" /></svg>
  }
  if (type === 'WhatsApp') {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 11.75a8.25 8.25 0 0 1-12.2 7.25L3 20.25l1.25-4.8A8.25 8.25 0 1 1 20.25 11.75Z"/><path strokeLinecap="round" strokeLinejoin="round" d="M8.5 8.25c.5 2.75 2 4.25 4.75 5l1-1 2 .75c-.25 1-1 1.75-2 1.75-3.75-.25-6.75-3.25-7-7 0-1 .75-1.75 1.75-2l.75 2-1.25.5Z"/></svg>
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-5 w-5"><rect x="3.25" y="5.25" width="17.5" height="13.5" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 7 7.5 5.75L19.5 7"/></svg>
}

function ContactLink({ href, title, detail, external = false }) {
  const className = 'group flex min-w-0 items-center gap-3 rounded-xl border border-navy/10 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-navy/25 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2'
  return (
    <a className={className} href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cream text-navy transition group-hover:bg-cream-deep">
        <ContactIcon type={title} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-navy">{title}</span>
        <span className="block truncate text-xs text-navy/60">{detail}</span>
      </span>
    </a>
  )
}

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [f, setF] = useState({ email: '', password: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const previousTitle = document.title
    const description = document.querySelector('meta[name="description"]')
    const previousDescription = description?.content
    document.title = 'Login | VN Group'
    if (description) description.content = 'Log in to your VN Group account.'
    return () => {
      document.title = previousTitle
      if (description && previousDescription !== undefined) description.content = previousDescription
    }
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      await login(f.email, f.password)
      nav('/')
    } catch (x) {
      setErr(x.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main id="main" tabIndex={-1} className="min-h-dvh bg-cream px-3 py-4 sm:px-6 sm:py-8">
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] w-full max-w-6xl content-center overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-[0_24px_80px_-36px_rgba(20,33,61,0.32)] lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative isolate flex flex-col overflow-hidden bg-cream px-5 pb-5 pt-6 sm:px-9 sm:pb-8 sm:pt-8 lg:px-12 lg:py-10">
          <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-52 h-72 w-72 rounded-full bg-[#E9D9B3]/40 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[#D9E1F0]/60 blur-3xl" />
          <header className="relative flex flex-wrap items-center justify-between gap-3">
            <Logo />
            <span className="rounded-full border border-navy/10 bg-white/75 px-3 py-1.5 text-xs font-medium text-navy/70">Secure account access</span>
          </header>

          <div className="relative mt-8 sm:mt-10 lg:mt-14">
            
            <h1 className="mt-4 max-w-xl font-sans text-3xl font-bold leading-tight text-navy sm:text-4xl lg:text-[2.8rem]">
              {siteContent.login.heroTitle}
            </h1>
           
          </div>

          <div className="relative mx-auto mt-2 flex w-full max-w-[460px] flex-1 items-center justify-center sm:mt-0 lg:mt-2 lg:min-h-[310px]">
            <div aria-hidden="true" className="absolute h-[82%] max-h-[330px] w-[82%] max-w-[330px] rounded-full bg-white/75 shadow-[inset_0_0_0_1px_rgba(20,33,61,0.04)]" />
            <img
              src={siteImages.loginGraduate.src}
              alt={siteImages.loginGraduate.alt}
              className="relative z-10 h-auto max-h-[290px] w-full max-w-[360px] object-contain mix-blend-multiply sm:max-h-[340px] lg:max-h-[390px]"
              width={siteImages.loginGraduate.width}
              height={siteImages.loginGraduate.height}
              fetchPriority="high"
            />
            <div className="absolute bottom-3 right-0 z-20 max-w-[190px] rounded-xl border border-navy/10 bg-white/95 p-3 shadow-sm sm:right-2">
              {siteContentReady(siteContent.login.quote) && <p className="text-xs font-semibold text-navy">{siteContent.login.quote}</p>}
            </div>
          </div>

        </section>

        <section className="flex flex-col justify-center px-5 py-7 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <div>
            <p className="text-sm font-medium text-navy/55">Welcome back</p>
            <h2 className="mt-1 font-sans text-3xl font-bold text-navy sm:text-4xl">Login</h2>
            <p className="mt-2 text-sm text-navy/65">Use your registered email and password to continue.</p>
          </div>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <Err msg={err} />
            {err.toLowerCase().includes('verify your email') && (
              <Link to={`/verify?email=${encodeURIComponent(f.email)}`} className="block rounded-lg bg-cream px-3 py-2 text-sm font-semibold text-navy underline underline-offset-2">
                Enter your verification code
              </Link>
            )}
            {err.toLowerCase().includes('awaiting approval') && (
              <p className="rounded-lg bg-cream px-3 py-2 text-sm leading-5 text-navy/75">
                Your account is waiting for approval from VN Group staff. You&apos;ll receive an email when it&apos;s approved.
              </p>
            )}
            <label className="block space-y-1.5 text-sm font-medium text-navy">
              <span>Email address</span>
              <Input type="email" name="email" autoComplete="email" required placeholder="you@example.com" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            </label>
            <label className="block space-y-1.5 text-sm font-medium text-navy">
              <span>Password</span>
              <PasswordInput name="password" autoComplete="current-password" required placeholder="Enter your password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
            </label>
            <div className="text-right">
              <Link to="/forgot-password" className="text-sm font-medium text-navy/70 underline underline-offset-2 hover:text-navy">Forgot password?</Link>
            </div>
            <Btn type="submit" className="w-full py-3 shadow-sm" disabled={busy}>{busy ? 'Logging in...' : 'Login'}</Btn>
          </form>

          <p className="mt-5 text-center text-sm text-navy/70">
            New here? <Link to="/register" className="font-semibold text-navy underline underline-offset-2">Create an account</Link>
          </p>

          <div className="mt-7 border-t border-navy/10 pt-5">
            <h3 className="text-sm font-semibold text-navy">Having trouble? Contact us</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {supportNumber && <ContactLink href={`tel:${supportNumber}`} title="Call" detail={supportNumber} />}
              {whatsappNumber && <ContactLink href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(contact.signInHelpMessage)}`} title="WhatsApp" detail="Chat with our team" external />}
              {supportEmail && <ContactLink href={`mailto:${supportEmail}?subject=${encodeURIComponent('Sign-in help')}`} title="Email" detail={supportEmail} />}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
