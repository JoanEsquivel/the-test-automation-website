import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { api } from '@/api/client'
import { errorCode, errorMessage } from '@/api/errorMessage'
import type { Order } from '@/api/types'
import { Banner } from '@/components/ui/Banner'
import { PageIntro } from '@/components/ui/PageIntro'
import { OrderStatusChip, OrderStatusTimeline } from './components/OrderStatusTimeline'
import { DetailSkeleton } from './components/Skeletons'
import { TotalsBox } from './components/TotalsBox'
import { formatDate, formatMoney } from './format'

export default function OrderDetailPage() {
  const { orderId = '' } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setNotFound(false)
    setError(null)
    api.orders
      .get(orderId)
      .then((fresh) => {
        if (!active) return
        setOrder(fresh)
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (!active) return
        if (errorCode(cause) === 'NOT_FOUND') setNotFound(true)
        else setError(errorMessage(cause, 'This order could not be loaded.'))
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [orderId])

  return (
    <div className="space-y-8">
      <PageIntro
        title="Order detail"
        what="The immutable snapshot of one order: the items and prices as they were at checkout, the shipping address, the card last4, the totals and where the order sits in its lifecycle."
        how="Follow the status timeline from pending to delivered — an admin can move an order along from /admin/orders, and this page reflects it on the next load."
      />

      {error && (
        <Banner tone="danger" data-testid="order-error">
          {error}
        </Banner>
      )}

      {notFound && (
        <Banner tone="warning" data-testid="order-not-found">
          No order with the id <code>{orderId}</code> belongs to your account.
        </Banner>
      )}

      {loading && <DetailSkeleton testId="order-skeleton" />}

      {!loading && order && (
        <div className="space-y-6">
          <header
            data-testid="order-header"
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-700 bg-ink-900 p-6"
          >
            <div>
              <h2 data-testid="order-number" className="font-display text-2xl font-bold text-mist-50">
                {order.orderNumber}
              </h2>
              <p data-testid="order-date" className="mt-1 text-sm text-mist-400">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            <OrderStatusChip status={order.status} />
          </header>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start">
            <div className="space-y-4">
              <section
                data-testid="order-items"
                aria-label="Ordered items"
                className="rounded-2xl border border-ink-700 bg-ink-900 p-6"
              >
                <h3 className="font-display text-base font-bold text-mist-50">Items</h3>
                <ul className="mt-3 divide-y divide-ink-800">
                  {order.items.map((item) => (
                    <li
                      key={item.productId}
                      data-testid={`order-item-${item.productId}`}
                      className="flex flex-wrap items-baseline justify-between gap-3 py-3 text-sm"
                    >
                      <span className="text-mist-100">
                        <Link to={`/shop/product/${item.productId}`} className="font-medium hover:text-volt-300">
                          {item.name}
                        </Link>
                        <span className="block text-xs text-mist-400">
                          {item.qty} × {formatMoney(item.unitPrice)}
                        </span>
                      </span>
                      <span className="font-medium tabular-nums text-mist-100">{formatMoney(item.lineTotal)}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <div className="grid gap-4 sm:grid-cols-2">
                <section
                  data-testid="order-address"
                  aria-label="Shipping address"
                  className="rounded-2xl border border-ink-700 bg-ink-900 p-6 text-sm"
                >
                  <h3 className="font-display text-base font-bold text-mist-50">Shipping address</h3>
                  <address className="mt-2 not-italic leading-relaxed text-mist-300">
                    <span className="block text-mist-100">{order.shippingAddress.fullName}</span>
                    <span className="block">{order.shippingAddress.street}</span>
                    <span className="block">
                      {order.shippingAddress.city} {order.shippingAddress.zip}
                    </span>
                    <span className="block">{order.shippingAddress.country}</span>
                  </address>
                </section>

                <section
                  data-testid="order-payment"
                  aria-label="Payment"
                  className="rounded-2xl border border-ink-700 bg-ink-900 p-6 text-sm"
                >
                  <h3 className="font-display text-base font-bold text-mist-50">Payment</h3>
                  <p className="mt-2 text-mist-300">
                    {order.paymentMethod.type === 'card' ? 'Card' : order.paymentMethod.type} ending in{' '}
                    <span data-testid="order-last4" className="font-mono font-semibold text-mist-50">
                      {order.paymentMethod.last4}
                    </span>
                  </p>
                  <p className="mt-2 text-xs text-mist-500">Simulated by the API — no real charge exists.</p>
                </section>
              </div>

              <OrderStatusTimeline status={order.status} />
            </div>

            <TotalsBox totals={order.totals} title="Order total">
              <Link
                to="/shop/orders"
                data-testid="back-to-orders"
                className="block text-center text-sm font-medium text-mist-300 hover:text-mist-50"
              >
                ← Back to order history
              </Link>
            </TotalsBox>
          </div>
        </div>
      )}
    </div>
  )
}
