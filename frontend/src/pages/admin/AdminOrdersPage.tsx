import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { api } from '@/api/client'
import { errorMessage } from '@/api/errorMessage'
import type { Order } from '@/api/types'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { PageIntro } from '@/components/ui/PageIntro'
import { useToast } from '@/components/ui/Toast'
import { ListSkeleton } from '@/pages/shop/components/Skeletons'
import { OrderStatusChip } from '@/pages/shop/components/OrderStatusTimeline'
import type { OrderStatus } from '@/pages/shop/components/OrderStatusTimeline'
import { formatDate, formatMoney } from '@/pages/shop/format'
import { AdminNav } from './AdminNav'

/** The normative transition graph (docs/02-specs/api-contract.md) — the same
 * one the API enforces, so an illegal transition is never offered here. */
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const STATUSES = Object.keys(STATUS_TRANSITIONS) as OrderStatus[]

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [choices, setChoices] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await api.admin.orders(statusFilter || undefined)
      setOrders(result)
      setError(null)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  async function applyStatus(order: Order) {
    const next = choices[order.id]
    if (!next) return
    setBusyId(order.id)
    try {
      await api.admin.updateOrderStatus(order.id, next)
      setChoices((current) => ({ ...current, [order.id]: '' }))
      toast({
        tone: 'success',
        message: `${order.orderNumber} is now ${STATUS_LABELS[next as OrderStatus]}.`,
      })
      await load()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageIntro
        title="Admin · Orders"
        what="Every order from every customer, plus the status controls the storefront never shows anyone."
        how="Filter by status, then walk an order through pending → paid → shipped → delivered. Only legal next states appear as buttons, and PATCH /api/admin/orders/:id/status enforces the same graph: send anything else and it answers 400 VALIDATION_ERROR. Worth testing from both ends."
      />
      <AdminNav />

      {error && (
        <Banner tone="danger" data-testid="admin-orders-error" onDismiss={() => setError(null)}>
          {error}
        </Banner>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <label htmlFor="order-status-filter" className="mb-1.5 block text-sm font-medium text-mist-200">
            Filter by status
          </label>
          <select
            id="order-status-filter"
            data-testid="order-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-56 rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-mist-50 focus:border-volt-400 focus:outline-none"
          >
            <option value="">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-mist-400">
          <span data-testid="admin-orders-count" className="font-semibold text-mist-100">
            {orders.length}
          </span>{' '}
          order{orders.length === 1 ? '' : 's'}
        </p>
      </div>

      {loading ? (
        <ListSkeleton rows={4} testId="admin-orders-skeleton" />
      ) : orders.length === 0 ? (
        <p
          data-testid="admin-orders-empty"
          className="rounded-2xl border border-ink-700 bg-ink-900 p-8 text-center text-sm text-mist-400"
        >
          No orders {statusFilter ? `with the “${STATUS_LABELS[statusFilter as OrderStatus]}” status` : 'yet'}.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink-700 bg-ink-900">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <caption className="sr-only">All customer orders with status transition controls</caption>
            <thead className="border-b border-ink-700 text-xs uppercase tracking-wider text-mist-400">
              <tr>
                <th scope="col" className="px-4 py-3">Order</th>
                <th scope="col" className="px-4 py-3">Customer</th>
                <th scope="col" className="px-4 py-3">Placed</th>
                <th scope="col" className="px-4 py-3 text-right">Total</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Advance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {orders.map((order) => {
                const nextStates = STATUS_TRANSITIONS[order.status] ?? []
                return (
                  <tr key={order.id} data-testid={`admin-order-row-${order.id}`} className="hover:bg-ink-800/50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/shop/orders/${order.id}`}
                        data-testid={`admin-order-link-${order.id}`}
                        className="font-medium text-volt-300 underline-offset-4 hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      <p className="font-mono text-xs text-mist-500">{order.id}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-mist-300">{order.userId}</td>
                    <td className="px-4 py-3 text-mist-300">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-mist-100">
                      {formatMoney(order.totals.total)}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusChip status={order.status} orderNumber={order.orderNumber} />
                    </td>
                    <td className="px-4 py-3">
                      {nextStates.length === 0 ? (
                        <p data-testid={`no-transitions-${order.id}`} className="text-xs text-mist-500">
                          No further transitions
                        </p>
                      ) : (
                        <div className="flex items-center gap-2">
                          <label htmlFor={`advance-status-${order.id}`} className="sr-only">
                            Next status for {order.orderNumber}
                          </label>
                          <select
                            id={`advance-status-${order.id}`}
                            data-testid={`advance-status-${order.id}`}
                            value={choices[order.id] ?? ''}
                            onChange={(event) =>
                              setChoices((current) => ({ ...current, [order.id]: event.target.value }))
                            }
                            className="rounded-lg border border-ink-600 bg-ink-800 px-2 py-1.5 text-sm text-mist-50 focus:border-volt-400 focus:outline-none"
                          >
                            <option value="">Choose…</option>
                            {nextStates.map((status) => (
                              <option key={status} value={status}>
                                {STATUS_LABELS[status]}
                              </option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            variant="secondary"
                            data-testid={`apply-status-${order.id}`}
                            disabled={!choices[order.id] || busyId === order.id}
                            onClick={() => void applyStatus(order)}
                          >
                            Apply
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
