import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import Documents from '@/pages/Documents'
import DocumentDetail from '@/pages/DocumentDetail'
import AdvancedSearch from '@/pages/AdvancedSearch'
import Notifications from '@/pages/Notifications'
import NotFound from '@/pages/NotFound'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AuthProvider } from '@/hooks/useAuth'

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="documents">
              <Route index element={<Documents />} />
              <Route path=":id" element={<DocumentDetail />} />
            </Route>
            <Route path="search" element={<AdvancedSearch />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
          
          {/* Fallback routes */}
          <Route path="404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
