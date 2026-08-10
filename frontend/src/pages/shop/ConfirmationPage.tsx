import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { api } from '@/api/client'
import { errorMessage } from '@/api/errorMessage'
import type { Order } from '@/api/types'
import { Banner } from '@/components/ui/Banner'
import { PageIntro } from '@/components/ui/PageIntro'
import { DetailSkeleton } from './components/Skeletons'
import { formatDate, formatMoney } from './format'

const WHAT_HAPPENED = [
  {
    emoji: '💳',
    title: 'The payment was simulated',
    body: 'The API ran the normative card rules — no money moved and nothing left your browser.',
  },
  {
    emoji: '📦',
    title: 'Stock was decremented',
    body: 'Every ordered unit came off the product stock, so the catalog badges update immediately.',
  },
  {
    emoji: '🛒',
    title: 'Your cart was emptied',
    body: 'The cart is now empty and the header badge is back to zero, exactly as a real store behaves.',
  },
]

export default function ConfirmationPage() {
  const { orderId = '' } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    api.orders
      .get(orderId)
      .then((fresh) => {
        if (!active) return
        setOrder(fresh)
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (!active) return
        setError(errorMessage(cause, 'This order could not be loaded.'))
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [orderId])

  return (
    <div className="space-y-8">
      <PageIntro
        title="Order confirmed"
        what="The receipt screen you land on straight after a successful checkout. It shows the freshly minted order number and spells out every side effect the API just applied."
        how="Copy the order number for your assertions, open the order detail for the full snapshot, or head back to the catalog and place another one."
      />

      {error && (
        <Banner tone="danger" data-testid="confirmation-error">
          {error}
        </Banner>
      )}

      {loading && <DetailSkeleton testId="confirmation-skeleton" />}

      {!loading && order && (
        <div className="space-y-6">
          <section
            data-testid="confirmation-hero"
            className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-10 text-center"
          >
            <p aria-hidden="true" className="text-5xl">
              ✅
            </p>
            <h2 className="font-display mt-4 text-lg font-bold text-emerald-200">Thank you — your order is placed</h2>
            <p
              data-testid="order-number"
              className="font-display mt-2 text-4xl font-bold tracking-tight text-mist-50 sm:text-5xl"
            >
              {order.orderNumber}
            </p>
            <p className="mt-3 text-sm text-emerald-100/80">
              Placed on {formatDate(order.createdAt)} · {order.items.length} line(s) ·{' '}
              <span data-testid="confirmation-total">{formatMoney(order.totals.total)}</span> paid with the card ending
              in {order.paymentMethod.last4}
            </p>
          </section>

          <section aria-label="What just happened" className="grid gap-4 sm:grid-cols-3">
            {WHAT_HAPPENED.map((entry) => (
              <article key={entry.title} className="rounded-2xl border border-ink-700 bg-ink-900 p-5">
                <p aria-hidden="true" className="text-2xl">
                  {entry.emoji}
                </p>
                <h3 className="font-display mt-2 text-sm font-bold text-mist-50">{entry.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-mist-400">{entry.body}</p>
              </article>
            ))}
          </section>

          <div className="flex flex-wrap gap-3">
            <Link
              to={`/shop/orders/${order.id}`}
              data-testid="view-order-detail"
              className="inline-flex items-center justify-center rounded-lg bg-volt-500 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-volt-400"
            >
              View order detail
            </Link>
            <Link
              to="/shop/orders"
              data-testid="view-order-history"
              className="inline-flex items-center justify-center rounded-lg border border-ink-600 bg-ink-700 px-4 py-2 text-sm font-medium text-mist-100 transition-colors hover:bg-ink-600"
            >
              Order history
            </Link>
            <Link
              to="/shop/catalog"
              data-testid="back-to-catalog"
              className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-mist-300 transition-colors hover:text-mist-50"
            >
              ← Back to the catalog
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
