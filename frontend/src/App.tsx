import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import Documents from '@/pages/Documents'
import EnhancedDocumentDetail from '@/pages/EnhancedDocumentDetail'
import AdvancedSearch from '@/pages/AdvancedSearch'
import Notifications from '@/pages/Notifications'
import NotFound from '@/pages/NotFound'
import Profile from '@/pages/Profile'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AuthProvider } from '@/hooks/useAuth'
// Import the API test component
import { ApiTestComponent } from './ApiTestComponent'

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
              <Route path="upload" element={<Documents />} />
              <Route path=":id" element={<EnhancedDocumentDetail />} />
            </Route>
            <Route path="search" element={<AdvancedSearch />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
            {/* API test route */}
            <Route path="api-test" element={<ApiTestComponent />} />
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
