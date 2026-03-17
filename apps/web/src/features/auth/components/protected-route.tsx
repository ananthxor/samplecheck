import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/contexts/auth-context'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  )
}

export function ProtectedRoute() {
  const { user, isLoading, mustChangePassword, mfaRequired } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Redirect to 2FA verification if MFA is enrolled but not yet verified
  if (mfaRequired && location.pathname !== '/verify-2fa') {
    return <Navigate to="/verify-2fa" replace />
  }

  if (mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  return <Outlet />
}

export function AdminRoute() {
  const { user, isLoading, isAdmin } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

/** Allows access to org_admin and super_admin roles. */
export function OrgAdminRoute() {
  const { user, isLoading, isAdmin, isOrgAdmin } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin && !isOrgAdmin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
