import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/Badge'

const PATHS = [
  {
    to: '/playground',
    testId: 'path-playground',
    emoji: '🧩',
    title: 'Components Playground',
    tagline: 'Master every element, one widget at a time.',
    bullets: [
      'Checkboxes, dropdowns, tables, modals — each in legacy and modern variants',
      'The correct modern implementation is always marked "Recommended"',
      'Three locator difficulty levels: easy, medium and evil',
      'Deliberate challenges: dynamic content, iframes, Shadow DOM, drag & drop',
    ],
    accent: 'from-volt-500/25',
  },
  {
    to: '/shop',
    testId: 'path-store',
    emoji: '🛒',
    title: 'TAW Store',
    tagline: 'A realistic ecommerce app to automate end to end.',
    bullets: [
      'Catalog, cart, coupons, 3-step checkout with simulated payments',
      'Auth, profiles, reviews, wishlist and order history',
      'Admin dashboard with role-based access and data tables',
      'Same REST API in the browser or against a real local backend',
    ],
    accent: 'from-pulse-500/25',
  },
]

export default function HomePage() {
  return (
    <div className="space-y-14">
      <section className="bg-blueprint relative overflow-hidden rounded-3xl border border-ink-700 bg-ink-900 px-6 py-14 text-center sm:px-12">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-volt-400">
          Selenium · Playwright · Cypress · Postman · RestAssured
        </p>
        <h1 className="font-display mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          The definitive playground for <span className="text-gradient">test automation</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-mist-300">
          Practice web and API testing against real-world UI patterns and a fully working store —
          with any tool on the market. Every page tells you exactly what it does and how to use it.
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
              Run the FastAPI backend locally and the UI talks to it over real HTTP. Point Postman or
              RestAssured at <code className="rounded bg-ink-800 px-1.5 py-0.5 text-volt-300">localhost:8000/docs</code>{' '}
              for genuine API testing practice.
            </p>
          </div>
          <div>
            <Badge tone="pulse">Browser mode · this deployment</Badge>
            <p className="mt-2 text-sm leading-relaxed text-mist-300">
              The same REST API is served inside your browser by a service worker, with data stored
              locally. The UI behaves identically — perfect for UI automation anywhere, no setup needed.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
