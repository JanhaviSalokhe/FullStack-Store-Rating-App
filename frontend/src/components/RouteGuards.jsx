import { Navigate, useLocation } from '../context/RouterContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function Loading() {
  return <p className="loading-message" role="status">Checking your session…</p>
}

export function ProtectedRoute({ roles, children }) {
  const { user, status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <Loading />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (roles && !roles.includes(user.role)) return <Navigate to={homePathFor(user)} replace />

  return children
}

export function PublicOnlyRoute({ children }) {
  const { user, status } = useAuth()

  if (status === 'loading') return <Loading />
  if (user) return <Navigate to={homePathFor(user)} replace />

  return children
}

function homePathFor(user) {
  if (user?.role === 'normal_user') return '/stores'
  return user?.role === 'system_administrator' ? '/admin' : '/dashboard'
}
