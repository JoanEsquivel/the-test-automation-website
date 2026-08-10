/** Engine admin — mirrors backend/app/routers/admin.py behavior 1:1.
 *
 * Every export is role-guarded: no token → 401 UNAUTHORIZED, a non-admin token
 * → 403 FORBIDDEN, exactly like the FastAPI `require_admin` dependency.
 */

import type { AdminStats, Order, Page, Product } from '@/api/types'
import { requireUser } from './auth'
import { paginate, withRating } from './catalog'
import { EngineError } from './errors'
import { db, newId, nowIso, type StoredUser } from './store'

type SeedProduct = Omit<Product, 'rating'>

export type OrderStatus = Order['status']

/** The normative transition graph (docs/02-specs/api-contract.md). */
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

export interface ProductCreateInput {
  name: string
  description: string
  price: number
  category: string
  tags?: string[]
  stock: number
  imageEmoji?: string
}

export type ProductUpdateInput = Partial<ProductCreateInput>

export interface AdminProductQuery {
  search?: string
  page?: number
  pageSize?: number
}

function requireAdmin(token: string | null): StoredUser {
  const user = requireUser(token)
  if (user.role !== 'admin') {
    throw new EngineError(403, 'FORBIDDEN', 'This endpoint requires the admin role.')
  }
  return user
}

export function listProducts(token: string | null, query: AdminProductQuery = {}): Page<Product> {
  requireAdmin(token)
  const pageSize = Math.min(query.pageSize ?? 12, 48)
  const page = query.page ?? 1
  let products = db.products.map(withRating)
  if (query.search) {
    const needle = query.search.toLowerCase()
    products = products.filter((product) => product.name.toLowerCase().includes(needle))
  }
  products.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return paginate(products, page, pageSize)
}

export function createProduct(token: string | null, input: ProductCreateInput): Product {
  requireAdmin(token)
  if (!input.name?.trim() || !input.category?.trim()) {
    throw new EngineError(400, 'VALIDATION_ERROR', 'name and category are required.')
  }
  if (input.price < 0 || input.stock < 0) {
    throw new EngineError(400, 'VALIDATION_ERROR', 'price and stock must be zero or greater.')
  }
  const product: SeedProduct = {
    id: newId('prod'),
    name: input.name.trim(),
    description: input.description ?? '',
    price: input.price,
    category: input.category,
    tags: input.tags ?? [],
    stock: input.stock,
    imageEmoji: input.imageEmoji || '📦',
    createdAt: nowIso(),
  }
  db.products = [...db.products, product]
  return withRating(product)
}

export function updateProduct(token: string | null, productId: string, input: ProductUpdateInput): Product {
  requireAdmin(token)
  const products = db.products
  const existing = products.find((product) => product.id === productId)
  if (!existing) {
    throw new EngineError(404, 'NOT_FOUND', `Product '${productId}' was not found.`)
  }
  const updates = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== null),
  ) as ProductUpdateInput
  if ((updates.price ?? 0) < 0 || (updates.stock ?? 0) < 0) {
    throw new EngineError(400, 'VALIDATION_ERROR', 'price and stock must be zero or greater.')
  }
  const updated: SeedProduct = { ...existing, ...updates, id: productId }
  db.products = products.map((product) => (product.id === productId ? updated : product))
  return withRating(updated)
}

export function deleteProduct(token: string | null, productId: string): void {
  requireAdmin(token)
  const products = db.products
  if (!products.some((product) => product.id === productId)) {
    throw new EngineError(404, 'NOT_FOUND', `Product '${productId}' was not found.`)
  }
  db.products = products.filter((product) => product.id !== productId)
}

export function listAllOrders(token: string | null, status?: string): Order[] {
  requireAdmin(token)
  const orders = status ? db.orders.filter((order) => order.status === status) : db.orders
  return [...orders].sort((a, b) => b.orderNumber.localeCompare(a.orderNumber))
}

export function updateOrderStatus(token: string | null, orderId: string, status: string): Order {
  requireAdmin(token)
  const orders = db.orders
  const order = orders.find((candidate) => candidate.id === orderId)
  if (!order) {
    throw new EngineError(404, 'NOT_FOUND', `Order '${orderId}' was not found.`)
  }
  const allowed = STATUS_TRANSITIONS[order.status] ?? []
  if (!allowed.includes(status as OrderStatus)) {
    throw new EngineError(
      400,
      'VALIDATION_ERROR',
      `Cannot transition from '${order.status}' to '${status}'. Allowed: ${
        allowed.length > 0 ? `[${[...allowed].sort().map((value) => `'${value}'`).join(', ')}]` : 'none'
      }.`,
    )
  }
  const updated: Order = { ...order, status: status as OrderStatus }
  db.orders = orders.map((candidate) => (candidate.id === orderId ? updated : candidate))
  return updated
}

export function stats(token: string | null): AdminStats {
  requireAdmin(token)
  const allOrders = db.orders
  const billable = allOrders.filter((order) => order.status !== 'cancelled')
  const products = db.products

  const ordersByStatus: Record<string, number> = {}
  for (const order of allOrders) {
    ordersByStatus[order.status] = (ordersByStatus[order.status] ?? 0) + 1
  }

  const revenueByCategory = new Map<string, number>()
  const unitsByProduct = new Map<string, { productId: string; name: string; unitsSold: number }>()
  for (const order of billable) {
    for (const item of order.items) {
      const category = products.find((product) => product.id === item.productId)?.category ?? 'unknown'
      revenueByCategory.set(category, (revenueByCategory.get(category) ?? 0) + item.lineTotal)
      const entry = unitsByProduct.get(item.productId) ?? {
        productId: item.productId,
        name: item.name,
        unitsSold: 0,
      }
      entry.unitsSold += item.qty
      unitsByProduct.set(item.productId, entry)
    }
  }

  const round2 = (value: number) => Math.round(value * 100) / 100

  return {
    totalRevenue: round2(billable.reduce((sum, order) => sum + order.totals.total, 0)),
    orderCount: billable.length,
    ordersByStatus,
    revenueByCategory: [...revenueByCategory.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, revenue]) => ({ category, revenue: round2(revenue) })),
    topProducts: [...unitsByProduct.values()].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5),
  }
}
