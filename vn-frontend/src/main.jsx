import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import './public-site.css'
import './leads.css'
import './home-page.css'
import './gallery-admin.css'
import './data-site.css'
import { AuthProvider, useAuth } from './auth'
import { Layout } from './ui'
import { About, Contact, Destinations, FAQs, Journey, NotFound, Privacy, PublicLayout } from './PublicSite'
import HomePage from './HomePage'
import Login from './pages/Login'
import Register from './pages/Register'
import Verify from './pages/Verify'
import Documents from './pages/Documents'
import Messages from './pages/Messages'
import Approvals from './pages/Approvals'
import Profile from './pages/Profile'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AuditLog from './pages/AuditLog'
import Users from './pages/Users'
import Leads from './pages/Leads'
import GalleryAdmin from './pages/GalleryAdmin'
import LegalPage from './components/layout/LegalPage'
import WhatsAppButton from './components/layout/WhatsAppButton'

function Guard() {
  const { user, loading } = useAuth()
  if (loading) return <p className="p-8">Loading...</p>
  return user ? <Layout /> : <Navigate to="/login" replace />
}

function StaffGuard() {
  const { user, loading } = useAuth()
  if (loading) return <p className="p-8">Loading...</p>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'consultancy_staff') return <Navigate to="/" replace />
  return <Layout />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<About />} />
            <Route path="/destinations" element={<Destinations />} />
            <Route path="/journey" element={<Journey />} />
            <Route path="/faqs" element={<FAQs />} />
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
          </Route>
          <Route element={<StaffGuard />}>
            <Route path="/leads" element={<Leads />} />
            <Route path="/gallery-admin" element={<GalleryAdmin />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/audit-log" element={<AuditLog />} />
            <Route path="/users" element={<Users />} />
          </Route>
        </Routes>
        <WhatsAppButton />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
