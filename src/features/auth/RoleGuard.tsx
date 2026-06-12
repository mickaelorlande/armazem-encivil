import { Navigate } from 'react-router'
import { useRole } from './useRole'

interface Props {
  require: 'admin' | 'gestor'
  children: React.ReactNode
}

/**
 * Renders children only when the authenticated user holds the required role.
 * Non-matching users are silently redirected to the root route.
 * Loading state passes through — the parent AuthGuard already blocks rendering
 * until the session + profile are resolved, so loading here should be transient.
 */
export function RoleGuard({ require: requiredRole, children }: Props) {
  const { role, loading } = useRole()

  if (loading) return null

  if (requiredRole === 'admin' && role !== 'admin') {
    return <Navigate to="/" replace />
  }

  if (requiredRole === 'gestor' && role !== 'admin' && role !== 'gestor') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
