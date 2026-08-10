import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/stores/auth'

/** Layout route guard: anonymous visitors are sent to the login page with a
 * `?returnTo=` pointing back at the page they asked for. */
export default function RequireAuth() {
  const token = useAuthStore((state) => state.token)
  const location = useLocation()

  if (!token) {
    const returnTo = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/account/login?returnTo=${returnTo}`} replace />
  }
  return <Outlet />
}
