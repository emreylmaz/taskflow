import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    // Kullanıcıyı login sayfasına yönlendir, dönüş URL'ini sakla
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
