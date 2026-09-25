import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

export function RequireAuth() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />

  return <Outlet />
}

export function RequireAdmin() {
  const { role, loading } = useAuth()

  if (loading) return null
  if (role !== 'ADMIN') return <Navigate to="/" replace />

  return <Outlet />
}
