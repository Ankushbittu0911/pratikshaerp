import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import Dashboard from './pages/dashboard/Dashboard'
import EnquiryList from './pages/enquiry/EnquiryList'
import EnquiryForm from './pages/enquiry/EnquiryForm'
import EnquiryDetail from './pages/enquiry/EnquiryDetail'
import QuotationList from './pages/quotation/QuotationList'
import QuotationDetail from './pages/quotation/QuotationDetail'
import PurchaseList from './pages/purchase/PurchaseList'
import PurchaseDetail from './pages/purchase/PurchaseDetail'
import MaterialList from './pages/material/MaterialList'
import ProductionList from './pages/production/ProductionList'
import ProductionDetail from './pages/production/ProductionDetail'
import MaterialRequestList from './pages/material/MaterialRequestList'
import NotificationList from './pages/notifications/NotificationList'
import ReportsPage from './pages/reports/ReportsPage'
import UsersPage from './pages/users/UsersPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user } = useAuth()
  return user ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="enquiries" element={<EnquiryList />} />
            <Route path="enquiries/new" element={<EnquiryForm />} />
            <Route path="enquiries/:id" element={<EnquiryDetail />} />
            <Route path="quotations" element={<QuotationList />} />
            <Route path="quotations/:id" element={<QuotationDetail />} />
            <Route path="purchase" element={<PurchaseList />} />
            <Route path="purchase/:id" element={<PurchaseDetail />} />
            <Route path="materials" element={<MaterialList />} />
            <Route path="production" element={<ProductionList />} />
            <Route path="production/:id" element={<ProductionDetail />} />
            <Route path="material-requests" element={<MaterialRequestList />} />
            <Route path="notifications" element={<NotificationList />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="users" element={<UsersPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
