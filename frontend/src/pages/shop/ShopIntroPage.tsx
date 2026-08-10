import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageIntro } from '@/components/ui/PageIntro'
import { resetAll } from '@/engine/store'
import { useModeStore } from '@/stores/mode'

/** The 12 implemented store features (normative list in docs/02-specs/ecommerce-spec.md). */
const FEATURES = [
  { emoji: '🗂️', title: 'Catalog', detail: 'Search, category filters, sorting and pagination — all mirrored in the URL.' },
  { emoji: '🔍', title: 'Product detail', detail: 'Gallery block, quantity stepper clamped to stock, tabbed content.' },
  { emoji: '⭐', title: 'Reviews & ratings', detail: 'Read reviews and post your own; the average updates instantly.' },
  { emoji: '💜', title: 'Wishlist', detail: 'Heart products while signed in, then move them to the cart.' },
  { emoji: '🛒', title: 'Cart', detail: 'Quantity steppers, remove, and live totals with tax and shipping.' },
  { emoji: '🎟️', title: 'Coupon codes', detail: 'Four seeded codes covering valid, minimum-spend, expired and disabled.' },
  { emoji: '🔀', title: 'Guest & member carts', detail: 'Shop anonymously, then watch the guest cart merge on login.' },
  { emoji: '🧾', title: '3-step checkout', detail: 'Shipping → Payment → Review wizard with per-field validation.' },
  { emoji: '💳', title: 'Simulated payment', detail: 'Masked card input, approvals and deterministic declines.' },
  { emoji: '📦', title: 'Order history', detail: 'Your past orders with status chips, totals and a detail timeline.' },
  { emoji: '👤', title: 'Profile & address book', detail: 'Edit your name and manage addresses with a default flag.' },
  { emoji: '📊', title: 'Admin dashboard', detail: 'Role-based area with stats, product CRUD and order status control.' },
]

const CREDENTIALS = [
  { role: 'Customer', email: 'customer@example.com', password: 'Password123!', tone: 'volt' as const },
  { role: 'Admin', email: 'admin@example.com', password: 'Admin123!', tone: 'pulse' as const },
]

const CARDS = [
  { number: '4111 1111 1111 1111', outcome: 'Payment approved', tone: 'success' as const },
  { number: 'Any card ending 0000', outcome: 'Payment declined (PAYMENT_DECLINED)', tone: 'danger' as const },
]

const COUPONS = [
  { code: 'WELCOME10', outcome: '10% off — always valid', tone: 'success' as const },
  { code: 'SAVE20', outcome: '$20 off — needs a $100+ subtotal', tone: 'warning' as const },
  { code: 'EXPIRED50', outcome: 'Rejected: COUPON_EXPIRED', tone: 'danger' as const },
  { code: 'DISABLED5', outcome: 'Rejected: COUPON_INVALID (inactive)', tone: 'danger' as const },
]

function Code({ children }: { children: string }) {
  return <code className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[0.8125rem] text-volt-300">{children}</code>
}

export default function ShopIntroPage() {
  const mode = useModeStore((state) => state.mode)
  const isBrowserMode = mode === 'browser'

  function handleReset() {
    const confirmed = window.confirm(
      'Reset the demo data? Every account change, cart, order, review and wishlist created in this browser will be wiped and the original seed data restored.',
    )
    if (!confirmed) return
    resetAll()
    window.location.reload()
  }

  return (
    <div className="space-y-10">
      <PageIntro
        title="TAW Store"
        what="A complete, realistic ecommerce application — catalog, cart, coupons, checkout, orders, reviews, wishlist and an admin area — built purely as a target for end-to-end test automation."
        how="Read this pre-screen first: it lists every implemented feature, the test accounts, the payment cards and the coupon codes you will need. Then use “Enter the store” to start shopping."
      />

      <section
        aria-labelledby="store-hero-heading"
        className="bg-blueprint relative overflow-hidden rounded-3xl border border-ink-700 bg-ink-900 px-6 py-10 sm:px-10"
      >
        <span aria-hidden="true" className="text-5xl">
          🛒
        </span>
        <h2 id="store-hero-heading" className="font-display mt-4 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
          Everything a real shop has — <span className="text-gradient">nothing you cannot automate</span>
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-mist-300">
          Every interactive element and every readout in the store carries a stable, kebab-case{' '}
          <Code>data-testid</Code>. There are no artificial locator traps here — those live in the
          Playground. The store is where you practise full journeys: browse, add to cart, apply a
          coupon, register, check out, verify the order, then log in as an admin and watch the same
          data from the other side.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            to="/shop/catalog"
            data-testid="enter-store"
            className="inline-flex items-center gap-2 rounded-xl bg-volt-500 px-6 py-3 text-base font-semibold text-ink-950 transition-colors hover:bg-volt-400"
          >
            Enter the store <span aria-hidden="true">→</span>
          </Link>
          <Link
            to="/account/register"
            data-testid="create-account-link"
            className="inline-flex items-center gap-2 rounded-xl border border-ink-600 bg-ink-800 px-6 py-3 text-base font-medium text-mist-100 transition-colors hover:bg-ink-700"
          >
            Create an account
          </Link>
        </div>
      </section>

      <section aria-labelledby="features-heading">
        <h2 id="features-heading" className="font-display text-xl font-bold">
          What is implemented
        </h2>
        <p className="mt-1 text-sm text-mist-400">
          All twelve features below are fully working in both API modes — nothing is a mockup.
        </p>
        <ul data-testid="feature-checklist" className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <li
              key={feature.title}
              className="flex gap-3 rounded-2xl border border-ink-700 bg-ink-900 p-4 transition-colors hover:border-ink-600"
            >
              <span aria-hidden="true" className="text-2xl">
                {feature.emoji}
              </span>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-mist-50">
                  <span aria-hidden="true" className="text-emerald-400">
                    ✓
                  </span>
                  {feature.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-mist-400">{feature.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section
        data-testid="mode-warning"
        aria-labelledby="mode-warning-heading"
        className="rounded-3xl border-2 border-amber-500/40 bg-amber-500/5 p-6"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span aria-hidden="true" className="text-2xl">
            ⚠️
          </span>
          <h2 id="mode-warning-heading" className="font-display text-xl font-bold text-amber-200">
            Read this before API testing
          </h2>
          <Badge
            tone={isBrowserMode ? 'pulse' : 'success'}
            data-testid="mode-warning-pill"
            className="ml-auto uppercase tracking-wide"
          >
            Now running: {isBrowserMode ? 'Browser mode' : 'Backend mode'}
          </Badge>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-ink-700 bg-ink-900 p-4">
            <h3 className="text-sm font-bold text-emerald-300">Backend mode — local only</h3>
            <p className="mt-2 text-sm leading-relaxed text-mist-300">
              The UI performs real HTTP calls against the FastAPI server at{' '}
              <Code>http://localhost:8000</Code>. This is the mode to use with Postman, RestAssured,
              Karate or any HTTP client: the OpenAPI explorer lives at <Code>/docs</Code>. Data resets
              when the server restarts.
            </p>
          </div>
          <div className="rounded-2xl border border-ink-700 bg-ink-900 p-4">
            <h3 className="text-sm font-bold text-pulse-300">Browser mode — this deployed site</h3>
            <p className="mt-2 text-sm leading-relaxed text-mist-300">
              Exactly the same REST API is served inside your browser by a service worker, with data
              persisted in <Code>localStorage</Code>. The UI behaves identically, so UI automation
              works anywhere — but <strong className="text-amber-200">network-level API testing
              requires the local backend</strong>, because these requests never leave the tab.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-ink-700 bg-ink-900 p-4">
          <p className="flex-1 text-sm leading-relaxed text-mist-300">
            {isBrowserMode
              ? 'Your store data lives in this browser. Reset it whenever a test run leaves it dirty — seed products, users, reviews and coupons come back exactly as shipped.'
              : 'Backend mode keeps its data in the FastAPI process. Restart the server to get a clean slate; the reset button only applies to browser mode.'}
          </p>
          {isBrowserMode && (
            <Button variant="secondary" data-testid="reset-demo-data" onClick={handleReset}>
              🧹 Reset demo data
            </Button>
          )}
        </div>
      </section>

      <section data-testid="test-credentials" aria-labelledby="credentials-heading" className="space-y-5">
        <div>
          <h2 id="credentials-heading" className="font-display text-xl font-bold">
            Test data cheat sheet
          </h2>
          <p className="mt-1 text-sm text-mist-400">
            The same accounts, cards and coupons exist in both modes — they come from the shared seed
            files, so your assertions can hard-code them.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-ink-700 bg-ink-900 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-volt-400">Accounts</h3>
            <dl className="mt-3 space-y-3">
              {CREDENTIALS.map((entry) => (
                <div key={entry.email} className="rounded-xl border border-ink-700 bg-ink-800/60 p-3">
                  <dt className="mb-1.5">
                    <Badge tone={entry.tone}>{entry.role}</Badge>
                  </dt>
                  <dd className="space-y-1 text-sm">
                    <p>
                      <Code>{entry.email}</Code>
                    </p>
                    <p>
                      <Code>{entry.password}</Code>
                    </p>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-mist-500">
              You can also register a brand-new account — passwords need 8+ characters and a digit.
            </p>
          </div>

          <div className="rounded-2xl border border-ink-700 bg-ink-900 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-volt-400">Payment cards</h3>
            <dl className="mt-3 space-y-3">
              {CARDS.map((card) => (
                <div key={card.number} className="rounded-xl border border-ink-700 bg-ink-800/60 p-3">
                  <dt className="text-sm">
                    <Code>{card.number}</Code>
                  </dt>
                  <dd className="mt-1.5">
                    <Badge tone={card.tone}>{card.outcome}</Badge>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-mist-500">
              Any future <Code>MM/YY</Code> expiry and a 3–4 digit CVC are accepted.
            </p>
          </div>

          <div className="rounded-2xl border border-ink-700 bg-ink-900 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-volt-400">Coupon codes</h3>
            <dl className="mt-3 space-y-3">
              {COUPONS.map((coupon) => (
                <div key={coupon.code} className="rounded-xl border border-ink-700 bg-ink-800/60 p-3">
                  <dt className="text-sm">
                    <Code>{coupon.code}</Code>
                  </dt>
                  <dd className="mt-1.5">
                    <Badge tone={coupon.tone}>{coupon.outcome}</Badge>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-mist-500">
              Shipping is free from $50; below that it is a flat $4.99. Tax is 8% of the discounted
              subtotal.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
