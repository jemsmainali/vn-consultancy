import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import '@fontsource-variable/inter'
import './index.css'
import './public-site.css'
import './leads.css'
import './home-page.css'
import './gallery-admin.css'
import './data-site.css'
import './gallery.css'
import './premium.css'
import './journey-gallery.css'
import './partner-gallery.css'
import './site-footer.css'
import './destinations.css'
import './auth.css'
import './portal.css'
import './study-plan.css'
import './visa.css'
import { AuthProvider, useAuth } from './auth'
import { Layout } from './ui'
const HomePage = lazy(() => import('./HomePage'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Verify = lazy(() => import('./pages/Verify'))
const Documents = lazy(() => import('./pages/Documents'))
const Messages = lazy(() => import('./pages/Messages'))
const Approvals = lazy(() => import('./pages/Approvals'))
const Profile = lazy(() => import('./pages/Profile'))
const StudyPlan = lazy(() => import('./pages/StudyPlan'))
const Universities = lazy(() => import('./pages/Universities'))
const Applications = lazy(() => import('./pages/Applications'))
const loadVisaPrep = () => import('./pages/VisaPrep')
const VisaHub = lazy(() => loadVisaPrep().then((module) => ({ default: module.VisaHub })))
const VisaChecklist = lazy(() => loadVisaPrep().then((module) => ({ default: module.VisaChecklist })))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const AuditLog = lazy(() => import('./pages/AuditLog'))
const Users = lazy(() => import('./pages/Users'))
const Leads = lazy(() => import('./pages/Leads'))
const GalleryAdmin = lazy(() => import('./pages/GalleryAdmin'))
const Gallery = lazy(() => import('./pages/Gallery'))
const LegalPage = lazy(() => import('./components/layout/LegalPage'))
const loadPublicSite = () => import('./PublicSite')
const PublicLayout = lazy(() => loadPublicSite().then((module) => ({ default: module.PublicLayout })))
const About = lazy(() => loadPublicSite().then((module) => ({ default: module.About })))
const Contact = lazy(() => loadPublicSite().then((module) => ({ default: module.Contact })))
const loadDestinations = () => import('./pages/Destinations')
const Destinations = lazy(() => loadDestinations().then((module) => ({ default: module.DestinationsHub })))
const DestinationDetail = lazy(() => loadDestinations().then((module) => ({ default: module.DestinationDetail })))
const FAQs = lazy(() => loadPublicSite().then((module) => ({ default: module.FAQs })))
const Journey = lazy(() => import('./pages/Journey'))
const NotFound = lazy(() => loadPublicSite().then((module) => ({ default: module.NotFound })))
const Privacy = lazy(() => loadPublicSite().then((module) => ({ default: module.Privacy })))
import WhatsAppButton from './components/layout/WhatsAppButton'

function SkipNavigation() {
  const location = useLocation()

  useEffect(() => {
    const focusMain = () => {
      const main = document.getElementById('main')
      if (!main) return false
      main.focus({ preventScroll: true })
      return true
    }
    const frame = window.requestAnimationFrame(() => {
      if (!location.hash) {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })
      }
      if (focusMain()) return
      const root = document.getElementById('root')
      if (!root) return
      const observer = new MutationObserver(() => {
        if (focusMain()) observer.disconnect()
      })
      observer.observe(root, { childList: true, subtree: true })
      window.setTimeout(() => observer.disconnect(), 10000)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [location.pathname])

  return <a className="skip-link" href="#main">Skip to content</a>
}

function RouteFallback() {
  return <div className="route-loading" role="status"><span className="route-loading-bar" /><span className="sr-only">Loading page</span></div>
}

function Guard() {
  const { user, loading } = useAuth()
  if (loading) return <p className="p-8">Loading...</p>
  return user ? <Layout /> : <Navigate to="/login" replace />
}

// Nested inside Guard; the API enforces the same student-only rule.
function StudentGuard() {
  const { user } = useAuth()
  return user.role === 'student' ? <Outlet /> : <Navigate to="/portal" replace />
}

function StaffGuard() {
  const { user, loading } = useAuth()
  if (loading) return <p className="p-8">Loading...</p>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'consultancy_staff') return <Navigate to="/" replace />
  return <Layout />
}

// Public demo build only (VITE_DEMO_MODE=true): make clear nothing here is a real record.
const DemoNotice = () => import.meta.env.VITE_DEMO_MODE === 'true' ? (
  <div role="note" style={{ background: '#102544', color: '#FFFFFF', textAlign: 'center', fontSize: 14, padding: '6px 16px' }}>
    Demo site: sample data only. Please do not enter real personal, document or bank details.
  </div>
) : null

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SkipNavigation />
      <DemoNotice />
      <AuthProvider>
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<About />} />
            <Route path="/destinations" element={<Destinations />} />
            <Route path="/destinations/:slug" element={<DestinationDetail />} />
            <Route path="/journey" element={<Journey />} />
            <Route path="/faqs" element={<FAQs />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<LegalPage type="terms" />} />
            <Route path="/refund-policy" element={<LegalPage type="refund" />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<Verify />} />
          <Route element={<Guard />}>
            <Route path="/portal" element={<Documents />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile" element={<Profile />} />
            {/* Students and staff; the page and GET /destinations/{slug} both enforce this. */}
            <Route path="/visa" element={<VisaHub />} />
            <Route path="/visa/:slug" element={<VisaChecklist />} />
            <Route element={<StudentGuard />}>
              <Route path="/study-plan" element={<StudyPlan />} />
              <Route path="/universities" element={<Universities />} />
              <Route path="/applications" element={<Applications />} />
            </Route>
          </Route>
          <Route element={<StaffGuard />}>
            <Route path="/leads" element={<Leads />} />
            <Route path="/gallery-admin" element={<GalleryAdmin />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/audit-log" element={<AuditLog />} />
            <Route path="/users" element={<Users />} />
          </Route>
        </Routes>
        </Suspense>
        <WhatsAppButton />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
