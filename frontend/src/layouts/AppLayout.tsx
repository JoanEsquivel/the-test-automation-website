import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

import { api } from '@/api/client'
import { ModeControl } from '@/components/ModeControl'
import { Banner } from '@/components/ui/Banner'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useModeStore } from '@/stores/mode'

const NAV_ITEMS = [
  { to: '/playground', label: 'Playground' },
  { to: '/shop', label: 'Store' },
]

function navClass({ isActive }: { isActive: boolean }) {
  return `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-ink-700 text-mist-50' : 'text-mist-300 hover:bg-ink-800 hover:text-mist-50'
  }`
}

function ModeBanners() {
  const { mode, forced, fallback, fallbackDismissed, dismissFallback } = useModeStore()
  return (
    <div className="mx-auto w-full max-w-6xl space-y-2 px-4 pt-4 empty:hidden">
      {forced && mode === 'browser' && (
        <Banner tone="info" data-testid="forced-browser-banner">
          This deployment runs <strong>entirely in your browser</strong>. A service worker serves
          the API and the data sits in localStorage. For real HTTP testing with Postman or
          RestAssured, clone the repo and start the local backend.
        </Banner>
      )}
      {fallback && !fallbackDismissed && (
        <Banner tone="warning" onDismiss={dismissFallback} data-testid="fallback-banner">
          Nothing answering at <code>localhost:8000</code>, so we switched to in-browser mode. Run{' '}
          <code>npm run dev:backend</code> and flip the toggle to come back.
        </Banner>
      )}
    </div>
  )
}

const ICON_LINK =
  'relative grid size-9 place-items-center rounded-lg border border-ink-700 bg-ink-900 text-base text-mist-300 transition-colors hover:border-ink-600 hover:text-mist-50'

/** Cart + wishlist shortcuts and the login / user area. */
function StoreControls() {
  const itemCount = useCartStore((state) => state.itemCount)
  const setCartId = useCartStore((state) => state.setCartId)
  const setItemCount = useCartStore((state) => state.setItemCount)
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const clearAuth = useAuthStore((state) => state.clear)
  const navigate = useNavigate()
  const toast = useToast()

  async function handleLogout() {
    try {
      await api.auth.logout()
    } catch {
      // Logging out is best effort: the client session is cleared regardless.
    }
    clearAuth()
    setCartId(null)
    setItemCount(0)
    toast({ tone: 'success', message: 'You are logged out.' })
    navigate('/')
  }

  return (
    <>
      <Link to="/shop/wishlist" data-testid="wishlist-link" className={ICON_LINK} aria-label="Wishlist">
        <span aria-hidden="true">♡</span>
      </Link>

      <Link
        to="/shop/cart"
        data-testid="cart-link"
        className={ICON_LINK}
        aria-label={`Cart, ${itemCount} item${itemCount === 1 ? '' : 's'}`}
      >
        <span aria-hidden="true">🛒</span>
        <span
          data-testid="cart-count"
          aria-hidden="true"
          className={`absolute -right-1.5 -top-1.5 min-w-5 rounded-full px-1 text-center text-[0.6875rem] font-bold leading-5 ${
            itemCount > 0 ? 'bg-volt-500 text-ink-950' : 'bg-ink-700 text-mist-400'
          }`}
        >
          {itemCount}
        </span>
      </Link>

      {token && user ? (
        <div className="flex items-center gap-2">
          {user.role === 'admin' && (
            <Link
              to="/admin"
              data-testid="admin-link"
              className="rounded-lg border border-pulse-500/40 bg-pulse-500/15 px-2.5 py-1.5 text-xs font-semibold text-pulse-300 hover:bg-pulse-500/25"
            >
              Admin
            </Link>
          )}
          <Link
            to="/account/profile"
            data-testid="user-name"
            className="hidden max-w-32 truncate text-sm font-medium text-mist-200 hover:text-mist-50 sm:block"
            title={user.email}
          >
            {user.name}
          </Link>
          <button
            type="button"
            data-testid="logout-button"
            onClick={handleLogout}
            className="rounded-lg border border-ink-600 bg-ink-800 px-2.5 py-1.5 text-xs font-medium text-mist-300 hover:bg-ink-700 hover:text-mist-50"
          >
            Log out
          </button>
        </div>
      ) : (
        <Link
          to="/account/login"
          data-testid="login-link"
          className="rounded-lg border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm font-medium text-mist-200 hover:bg-ink-700 hover:text-mist-50"
        >
          Log in
        </Link>
      )}
    </>
  )
}

/** Site chrome: header with nav, footer with the always-visible creator credit. */
function AppChrome() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b border-ink-700 bg-ink-950/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4">
          <Link to="/" className="flex items-center gap-2" aria-label="TAW home">
            <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-volt-500 to-pulse-600 font-display text-sm font-bold text-ink-950">
              TA
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              <span className="text-gradient">TAW</span>
            </span>
          </Link>

          <nav aria-label="Primary" className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3" data-testid="header-status-area">
            <ModeControl />
            <span aria-hidden="true" className="h-6 w-px bg-ink-700" />
            <StoreControls />
          </div>
        </div>
      </header>

      <ModeBanners />

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-ink-700 bg-ink-900/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-sm text-mist-400 sm:flex-row">
          <p data-testid="creator-credit">
            Built by{' '}
            <a
              href="https://www.linkedin.com/in/joanesquivel/"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-volt-400 hover:text-volt-300 hover:underline"
            >
              Joan Esquivel
            </a>
          </p>
          <p className="flex items-center gap-3">
            <a
              href="https://github.com/JoanEsquivel/the-test-automation-website"
              target="_blank"
              rel="noreferrer"
              className="hover:text-mist-200 hover:underline"
            >
              Source on GitHub
            </a>
            <span aria-hidden="true">·</span>
            <span>A sandbox for practising test automation</span>
          </p>
        </div>
      </footer>
    </div>
  )
}

/** Everything inside the app chrome can raise toasts. */
export default function AppLayout() {
  return (
    <ToastProvider>
      <AppChrome />
    </ToastProvider>
  )
}
