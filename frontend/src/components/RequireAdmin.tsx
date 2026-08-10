import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/stores/auth'

/** Layout route guard for `/admin`.
 *
 * Anonymous visitors bounce to the login page with a `?returnTo=`; a signed-in
 * account without the `admin` role gets a styled 403 page instead of a silent
 * redirect, so role-based access control is observable in a test.
 */
export default function RequireAdmin() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  if (!token) {
    const returnTo = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/account/login?returnTo=${returnTo}`} replace />
  }

  if (user?.role !== 'admin') {
    return (
      <div
        data-testid="forbidden"
        role="alert"
        className="mx-auto max-w-2xl rounded-2xl border border-red-500/40 bg-ink-900 p-10 text-center"
      >
        <p aria-hidden="true" className="text-5xl">
          🔒
        </p>
        <p className="font-display mt-4 text-xs font-bold uppercase tracking-[0.2em] text-red-300">
          403 — Forbidden
        </p>
        <h1 className="font-display mt-2 text-2xl font-bold text-mist-50">
          This area needs the admin role
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-mist-300">
          You are signed in as{' '}
          <strong className="text-mist-100">{user?.email ?? 'a customer account'}</strong>, role{' '}
          <strong className="text-mist-100">{user?.role ?? 'customer'}</strong>. Any{' '}
          <code className="rounded bg-ink-800 px-1 py-0.5 text-xs text-mist-200">/api/admin/*</code>{' '}
          call with this token comes back{' '}
          <code className="rounded bg-ink-800 px-1 py-0.5 text-xs text-mist-200">403 FORBIDDEN</code>, and
          the UI shows you the same thing rather than redirecting quietly.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-mist-400">
          Log out and sign back in as{' '}
          <span className="font-mono text-xs text-mist-200">admin@example.com</span> /{' '}
          <span className="font-mono text-xs text-mist-200">Admin123!</span> to reach the dashboard.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            data-testid="forbidden-home-link"
            className="rounded-lg bg-volt-500 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-volt-400"
          >
            Back to home
          </Link>
          <Link
            to="/account/login"
            data-testid="forbidden-login-link"
            className="rounded-lg border border-ink-600 bg-ink-800 px-4 py-2 text-sm font-medium text-mist-200 transition-colors hover:bg-ink-700 hover:text-mist-50"
          >
            Switch account
          </Link>
        </div>
      </div>
    )
  }

  return <Outlet />
}
