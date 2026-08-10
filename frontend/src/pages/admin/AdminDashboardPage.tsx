import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { api } from '@/api/client'
import { errorMessage } from '@/api/errorMessage'
import type { AdminStats, Order } from '@/api/types'
import { Banner } from '@/components/ui/Banner'
import { PageIntro } from '@/components/ui/PageIntro'
import { formatMoney } from '@/pages/shop/format'
import { ListSkeleton } from '@/pages/shop/components/Skeletons'
import { AdminNav } from './AdminNav'
import { BarChart } from './components/BarChart'
import type { ChartRow } from './components/BarChart'
import { DonutChart } from './components/DonutChart'
import { StatTile } from './components/StatTile'

const LOW_STOCK_THRESHOLD = 5

const STATUS_ORDER: Order['status'][] = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']

const STATUS_LABELS: Record<Order['status'], string> = {
  pending: 'Pending',
  paid: 'Paid',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

/** Reserved status hues, validated for the ink-900 surface (lightness band,
 * chroma floor, CVD separation and 3:1 contrast). Never reused as series colors. */
const STATUS_COLORS: Record<string, string> = {
  pending: '#d97706',
  paid: '#059669',
  shipped: '#8b5cf6',
  delivered: '#0891b2',
  cancelled: '#ef4444',
}

function titleCase(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [lowStock, setLowStock] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([api.admin.stats(), api.admin.products({ pageSize: 48 })])
      .then(([freshStats, products]) => {
        if (!active) return
        setStats(freshStats)
        setLowStock(products.items.filter((product) => product.stock < LOW_STOCK_THRESHOLD).length)
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (!active) return
        setError(errorMessage(cause, 'The dashboard data could not be loaded.'))
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const totalOrders = Object.values(stats?.ordersByStatus ?? {}).reduce((sum, count) => sum + count, 0)
  const averageOrderValue = stats && stats.orderCount > 0 ? stats.totalRevenue / stats.orderCount : 0

  const revenueRows: ChartRow[] = (stats?.revenueByCategory ?? []).map((entry) => ({
    key: entry.category,
    label: titleCase(entry.category),
    value: entry.revenue,
    display: formatMoney(entry.revenue),
  }))

  const statusRows: ChartRow[] = STATUS_ORDER.filter((status) => (stats?.ordersByStatus[status] ?? 0) > 0).map(
    (status) => ({
      key: status,
      label: STATUS_LABELS[status],
      value: stats?.ordersByStatus[status] ?? 0,
      display: String(stats?.ordersByStatus[status] ?? 0),
    }),
  )

  return (
    <div className="space-y-8">
      <PageIntro
        title="Admin dashboard"
        what="The role-guarded side of the store. Everything comes from GET /api/admin/stats and the admin product list, so a customer token renders a 403 page instead of this."
        how="Four tiles for the headline numbers, two charts for the breakdown. Each chart repeats its numbers in a screen-reader table underneath, so you can assert the values without going anywhere near a pixel."
      />

      <AdminNav />

      {error && (
        <Banner tone="danger" data-testid="admin-stats-error">
          {error}
        </Banner>
      )}

      {loading && <ListSkeleton rows={2} testId="dashboard-skeleton" />}

      {!loading && stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              data-testid="stat-total-revenue"
              label="Total revenue"
              value={formatMoney(stats.totalRevenue)}
              hint="Every order total except cancelled ones."
            />
            <StatTile
              data-testid="stat-order-count"
              label="Orders"
              value={String(stats.orderCount)}
              hint="All customers, cancelled orders excluded."
            />
            <StatTile
              data-testid="stat-avg-order-value"
              label="Average order value"
              value={formatMoney(averageOrderValue)}
              hint="Revenue divided by order count."
            />
            <StatTile
              data-testid="stat-low-stock"
              label="Low stock"
              value={String(lowStock)}
              hint={`Products with fewer than ${LOW_STOCK_THRESHOLD} units left.`}
            />
          </div>

          {totalOrders === 0 ? (
            <div
              data-testid="dashboard-empty"
              className="rounded-2xl border border-dashed border-ink-600 bg-ink-900 p-10 text-center"
            >
              <p aria-hidden="true" className="text-4xl">
                📊
              </p>
              <h2 className="font-display mt-3 text-lg font-bold">No orders to chart yet</h2>
              <p className="mt-1 text-sm text-mist-400">
                The charts show up as soon as one order exists. Go and buy something with card
                4111 1111 1111 1111, then come back.
              </p>
              <Link
                to="/shop/catalog"
                data-testid="dashboard-store-link"
                className="mt-5 inline-flex items-center justify-center rounded-lg bg-volt-500 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-volt-400"
              >
                Open the store
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <BarChart
                title="Revenue by category"
                description="Line-item revenue of every non-cancelled order, grouped by the product's category."
                measureLabel="Revenue"
                rows={revenueRows}
                chartTestId="revenue-by-category-chart"
                tableTestId="revenue-by-category-table"
                rowTestId={(row) => `revenue-row-${row.key}`}
              />
              <DonutChart
                title="Orders by status"
                description="Every order ever placed, including cancelled ones, split by its current status."
                measureLabel="Orders"
                categoryHeader="Status"
                rows={statusRows}
                colors={STATUS_COLORS}
                chartTestId="orders-by-status-chart"
                tableTestId="orders-by-status-table"
                rowTestId={(row) => `status-row-${row.key}`}
              />
            </div>
          )}

          {stats.topProducts.length > 0 && (
            <section className="rounded-2xl border border-ink-700 bg-ink-900 p-6">
              <h2 className="font-display text-base font-bold text-mist-50">Top products</h2>
              <p className="mt-1 text-xs text-mist-400">By units sold. The API returns five at most.</p>
              <table data-testid="top-products-table" className="mt-4 w-full text-left text-sm">
                <caption className="sr-only">Top products by units sold</caption>
                <thead className="text-xs uppercase tracking-widest text-mist-500">
                  <tr>
                    <th scope="col" className="py-1.5 font-semibold">
                      Product
                    </th>
                    <th scope="col" className="py-1.5 text-right font-semibold">
                      Units sold
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-800">
                  {stats.topProducts.map((product) => (
                    <tr key={product.productId} data-testid={`top-product-${product.productId}`}>
                      <th scope="row" className="py-1.5 font-medium text-mist-200">
                        {product.name}
                      </th>
                      <td className="py-1.5 text-right tabular-nums text-mist-300">{product.unitsSold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </div>
  )
}
