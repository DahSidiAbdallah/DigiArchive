import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAuth()
  
  useEffect(() => {
    console.log('ProtectedRoute Auth State:', { isAuthenticated, isLoading, user });
  }, [isAuthenticated, isLoading, user]);
  
  if (isLoading) {
    // You can replace this with a loading spinner or component
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-gray-500">Chargement en cours...</p>
      </div>
    </div>
  }
  
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />
  }
  
  console.log('User is authenticated, rendering protected content');
  // Render the child routes
  return <Outlet />
}
