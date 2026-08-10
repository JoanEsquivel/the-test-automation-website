import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { api } from '@/api/client'
import { errorMessage } from '@/api/errorMessage'
import type { Order } from '@/api/types'
import { Banner } from '@/components/ui/Banner'
import { PageIntro } from '@/components/ui/PageIntro'
import { OrderStatusChip } from './components/OrderStatusTimeline'
import { ListSkeleton } from './components/Skeletons'
import { formatDate, formatMoney } from './format'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    api.orders
      .list()
      .then((fresh) => {
        if (!active) return
        setOrders(fresh)
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (!active) return
        setError(errorMessage(cause, 'Your orders could not be loaded.'))
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="space-y-8">
      <PageIntro
        title="Order history"
        what="Every order placed by the signed-in account, newest first — order number, date, status and total, straight from GET /api/orders."
        how="Open any row to see the full snapshot: items, shipping address, card last4, totals and the status timeline. New accounts start with an empty history."
      />

      {error && (
        <Banner tone="danger" data-testid="orders-error">
          {error}
        </Banner>
      )}

      {loading && <ListSkeleton rows={3} testId="orders-skeleton" />}

      {!loading && orders.length === 0 && !error && (
        <div
          data-testid="empty-orders"
          className="rounded-2xl border border-dashed border-ink-600 bg-ink-900 p-10 text-center"
        >
          <p aria-hidden="true" className="text-4xl">
            🧾
          </p>
          <h2 className="font-display mt-3 text-lg font-bold">No orders yet</h2>
          <p className="mt-1 text-sm text-mist-400">
            Place one from the cart and it will appear here the moment the API confirms it.
          </p>
          <Link
            to="/shop/catalog"
            data-testid="orders-catalog-link"
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-volt-500 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-volt-400"
          >
            Browse the catalog
          </Link>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-ink-700 bg-ink-900">
          <table data-testid="orders-table" className="w-full min-w-[34rem] text-left text-sm">
            <caption className="sr-only">Your orders, newest first</caption>
            <thead className="border-b border-ink-700 text-xs uppercase tracking-widest text-mist-400">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Order
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Date
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {orders.map((order) => (
                <tr key={order.id} data-testid={`order-row-${order.orderNumber}`} className="hover:bg-ink-800/60">
                  <td className="px-5 py-4">
                    <Link
                      to={`/shop/orders/${order.id}`}
                      data-testid={`order-link-${order.orderNumber}`}
                      className="font-mono font-semibold text-volt-300 hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-mist-300">{formatDate(order.createdAt)}</td>
                  <td className="px-5 py-4">
                    <OrderStatusChip status={order.status} orderNumber={order.orderNumber} />
                  </td>
                  <td className="px-5 py-4 text-right font-medium tabular-nums text-mist-100">
                    {formatMoney(order.totals.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
