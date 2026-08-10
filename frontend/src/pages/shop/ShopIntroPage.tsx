import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageIntro } from '@/components/ui/PageIntro'
import { resetAll } from '@/engine/store'
import { useModeStore } from '@/stores/mode'

/** The 12 implemented store features (normative list in docs/02-specs/ecommerce-spec.md). */
const FEATURES = [
  { emoji: '🗂️', title: 'Catalog', detail: 'Search, category filters, sort and pagination. All four live in the URL.' },
  { emoji: '🔍', title: 'Product detail', detail: 'Quantity stepper clamped to stock, tabs, live rating.' },
  { emoji: '⭐', title: 'Reviews & ratings', detail: 'Post a review and the average recalculates on the spot.' },
  { emoji: '💜', title: 'Wishlist', detail: 'Heart products while signed in, then move them to the cart.' },
  { emoji: '🛒', title: 'Cart', detail: 'Steppers, remove, and totals that recalculate on every change.' },
  { emoji: '🎟️', title: 'Coupon codes', detail: 'Four codes: one valid, one with a minimum, one expired, one disabled.' },
  { emoji: '🔀', title: 'Guest & member carts', detail: 'Shop anonymously, log in, watch the guest cart merge.' },
  { emoji: '🧾', title: '3-step checkout', detail: 'Shipping, payment, review. Each field validated on its own step.' },
  { emoji: '💳', title: 'Simulated payment', detail: 'Card input masks itself. Approvals and declines are deterministic.' },
  { emoji: '📦', title: 'Order history', detail: 'Past orders with status, totals and a per-order timeline.' },
  { emoji: '👤', title: 'Profile & address book', detail: 'Rename yourself, add addresses, promote one to default.' },
  { emoji: '📊', title: 'Admin dashboard', detail: 'Stats, product CRUD and order status control, behind a role check.' },
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
  { code: 'WELCOME10', outcome: '10% off, always valid', tone: 'success' as const },
  { code: 'SAVE20', outcome: '$20 off, needs a $100+ subtotal', tone: 'warning' as const },
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
      'Reset the demo data? Everything you created in this browser (carts, orders, reviews, wishlists, account edits) is deleted and the seed data comes back.',
    )
    if (!confirmed) return
    resetAll()
    window.location.reload()
  }

  return (
    <div className="space-y-10">
      <PageIntro
        title="TAW Store"
        what="A working shop: catalog, cart, coupons, checkout, orders, reviews, wishlist and an admin area. It exists to be automated."
        how="Skim this page first. It lists what is built, the test accounts, the card numbers and the coupon codes, so you can hard-code them in your suite. Then hit “Enter the store”."
      />

      <section
        aria-labelledby="store-hero-heading"
        className="bg-blueprint relative overflow-hidden rounded-3xl border border-ink-700 bg-ink-900 px-6 py-10 sm:px-10"
      >
        <span aria-hidden="true" className="text-5xl">
          🛒
        </span>
        <h2 id="store-hero-heading" className="font-display mt-4 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
          A real shop, <span className="text-gradient">no locator traps</span>
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-mist-300">
          Every control and every readout here carries a stable kebab-case <Code>data-testid</Code>.
          The nasty selectors live in the Playground. This side is for whole journeys: buy something,
          check out, then sign in as admin and watch the same order from the other side.
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
          Twelve features, all of them wired to the API in both modes. None of it is a mockup.
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
            <h3 className="text-sm font-bold text-emerald-300">Backend mode (local only)</h3>
            <p className="mt-2 text-sm leading-relaxed text-mist-300">
              Real HTTP calls to the FastAPI server at <Code>http://localhost:8000</Code>. Use this
              one with Postman, RestAssured, Karate or curl. The OpenAPI explorer is at{' '}
              <Code>/docs</Code>. Restarting the server wipes the data.
            </p>
          </div>
          <div className="rounded-2xl border border-ink-700 bg-ink-900 p-4">
            <h3 className="text-sm font-bold text-pulse-300">Browser mode (this deployed site)</h3>
            <p className="mt-2 text-sm leading-relaxed text-mist-300">
              A service worker serves the same REST API inside the tab and keeps the data in{' '}
              <Code>localStorage</Code>. The UI behaves the same, so UI automation runs anywhere. But{' '}
              <strong className="text-amber-200">network-level API testing needs the local backend</strong>:
              these requests never leave the tab, so a proxy or an HTTP client sees nothing.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-ink-700 bg-ink-900 p-4">
          <p className="flex-1 text-sm leading-relaxed text-mist-300">
            {isBrowserMode
              ? 'Store data lives in this browser. When a test run leaves it dirty, reset it: products, users, reviews and coupons come back exactly as shipped.'
              : 'Backend mode keeps its data in the FastAPI process. Restart the server for a clean slate. The reset button is browser mode only.'}
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
            Both modes read the same seed files, so these values are identical either way. Hard-code
            them.
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
              Registering your own works too. Passwords need 8+ characters and at least one digit.
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
              Any future <Code>MM/YY</Code> expiry passes. CVC is 3 or 4 digits.
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
              Shipping is free from $50, otherwise a flat $4.99. Tax is 8% of the discounted
              subtotal.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
