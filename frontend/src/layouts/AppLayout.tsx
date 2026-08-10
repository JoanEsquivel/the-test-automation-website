import { Link, NavLink, Outlet } from 'react-router-dom'

import { ModeControl } from '@/components/ModeControl'
import { Banner } from '@/components/ui/Banner'
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
          This deployed demo runs <strong>fully in your browser</strong> — the API is served by a
          service worker and data lives in localStorage. For real HTTP/API testing (Postman,
          RestAssured), clone the repo and run the local backend.
        </Banner>
      )}
      {fallback && !fallbackDismissed && (
        <Banner tone="warning" onDismiss={dismissFallback} data-testid="fallback-banner">
          Backend unreachable at <code>localhost:8000</code> — switched to in-browser mode. Start
          the backend (<code>npm run dev:backend</code>) and flip the toggle to go back.
        </Banner>
      )}
    </div>
  )
}

/** Site chrome: header with nav, footer with the always-visible creator credit. */
export default function AppLayout() {
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
            <span>A sandbox for practicing test automation</span>
          </p>
        </div>
      </footer>
    </div>
  )
}
