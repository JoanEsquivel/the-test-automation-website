import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/Badge'

const PATHS = [
  {
    to: '/playground',
    testId: 'path-playground',
    emoji: '🧩',
    title: 'Components Playground',
    tagline: 'One widget, several implementations. Some of them awful.',
    bullets: [
      'Checkboxes, dropdowns, tables and modals, built the good way and the legacy way',
      'The implementation you should copy carries a "Recommended" badge',
      'Locator difficulty: easy keeps the test ids, evil takes them away',
      'Waits, iframes, Shadow DOM, drag & drop and other things that break scripts',
    ],
    accent: 'from-volt-500/25',
  },
  {
    to: '/shop',
    testId: 'path-store',
    emoji: '🛒',
    title: 'TAW Store',
    tagline: 'A shop that actually works, so you can automate a real journey.',
    bullets: [
      'Catalog, cart, coupons and a 3-step checkout with simulated payments',
      'Login, profiles, reviews, wishlist, order history',
      'Admin dashboard behind a role check, with tables and charts',
      'The same REST API in the browser or against a local backend',
    ],
    accent: 'from-pulse-500/25',
  },
]

export default function HomePage() {
  return (
    <div className="space-y-14">
      <section className="bg-blueprint relative overflow-hidden rounded-3xl border border-ink-700 bg-ink-900 px-6 py-14 text-center sm:px-12">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-volt-400">
          Web and API automation · any framework
        </p>
        <h1 className="font-display mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          A place to practise <span className="text-gradient">test automation</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-mist-300">
          UI patterns that break scripts, and a working store to automate end to end. Bring whatever
          tool you use. Every page says up front what it does and what to do with it.
        </p>
      </section>

      <section aria-label="Choose your practice path" className="grid gap-6 lg:grid-cols-2">
        {PATHS.map((path) => (
          <Link
            key={path.to}
            to={path.to}
            data-testid={path.testId}
            className={`group relative overflow-hidden rounded-3xl border border-ink-700 bg-gradient-to-br ${path.accent} to-ink-900 p-8 transition-transform hover:-translate-y-1 hover:border-ink-600`}
          >
            <div className="flex items-start justify-between">
              <span aria-hidden="true" className="text-5xl">
                {path.emoji}
              </span>
              <span
                aria-hidden="true"
                className="font-display text-2xl text-mist-500 transition-transform group-hover:translate-x-1 group-hover:text-volt-400"
              >
                →
              </span>
            </div>
            <h2 className="font-display mt-6 text-2xl font-bold">{path.title}</h2>
            <p className="mt-1 text-sm font-medium text-mist-400">{path.tagline}</p>
            <ul className="mt-5 space-y-2">
              {path.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2 text-sm leading-relaxed text-mist-300">
                  <span aria-hidden="true" className="mt-0.5 text-volt-400">
                    ▸
                  </span>
                  {bullet}
                </li>
              ))}
            </ul>
          </Link>
        ))}
      </section>

      <section aria-label="How the dual mode works" className="rounded-3xl border border-ink-700 bg-ink-900 p-8">
        <h2 className="font-display text-xl font-bold">One site, two modes</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <Badge tone="success">Backend mode · local</Badge>
            <p className="mt-2 text-sm leading-relaxed text-mist-300">
              Run the FastAPI backend and the UI talks to it over real HTTP. Point Postman or
              RestAssured at <code className="rounded bg-ink-800 px-1.5 py-0.5 text-volt-300">localhost:8000/docs</code>{' '}
              and you have an API to test.
            </p>
          </div>
          <div>
            <Badge tone="pulse">Browser mode · this deployment</Badge>
            <p className="mt-2 text-sm leading-relaxed text-mist-300">
              A service worker serves the same REST API inside the tab and keeps the data in
              localStorage. The UI behaves the same, so UI automation runs anywhere with no setup.
              Network-level API testing needs the backend.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
