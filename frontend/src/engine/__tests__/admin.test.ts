// ATDD: engine admin must mirror backend/app/routers/admin.py behavior 1:1
// (role guard, product CRUD, order status graph, stats math).
import { beforeEach, describe, expect, it } from 'vitest'

import type { AddressInput, PaymentInput } from '@/api/types'
import {
  createProduct,
  deleteProduct,
  listAllOrders,
  listProducts,
  stats,
  updateOrderStatus,
  updateProduct,
} from '../admin'
import { login } from '../auth'
import { addItem } from '../cart'
import { getProduct } from '../catalog'
import { checkout } from '../orders'
import { resetAll } from '../store'

const ADDRESS: AddressInput = {
  label: 'Home',
  fullName: 'Casey Customer',
  street: '742 Evergreen Terrace',
  city: 'Springfield',
  zip: '49007',
  country: 'United States',
  isDefault: true,
}

const GOOD_CARD: PaymentInput = {
  cardNumber: '4111 1111 1111 1111',
  expiry: '12/30',
  cvc: '123',
  cardHolder: 'Casey Customer',
}

const NEW_PRODUCT = {
  name: 'Test Gadget',
  description: 'Created by the admin test suite.',
  price: 42,
  category: 'accessories',
  tags: ['test'],
  stock: 10,
  imageEmoji: '🧪',
}

function adminToken(): string {
  return login({ email: 'admin@example.com', password: 'Admin123!' }).token
}

function customerToken(): string {
  return login({ email: 'customer@example.com', password: 'Password123!' }).token
}

/** Place a real order through the engine's own checkout (status `paid`). */
function placeOrder(productId = 'prod-pulse-earbuds'): string {
  const token = customerToken()
  addItem(token, null, { productId, qty: 1 })
  return checkout(token, { shippingAddress: ADDRESS, payment: GOOD_CARD }).id
}

beforeEach(() => {
  localStorage.clear()
  resetAll()
})

describe('admin role guard', () => {
  it('rejects anonymous callers with 401', () => {
    expect(() => listProducts(null, {})).toThrowError(
      expect.objectContaining({ status: 401, code: 'UNAUTHORIZED' }),
    )
  })

  it('rejects non-admin callers with 403 FORBIDDEN', () => {
    expect(() => listProducts(customerToken(), {})).toThrowError(
      expect.objectContaining({ status: 403, code: 'FORBIDDEN' }),
    )
  })

  it('guards every admin endpoint', () => {
    const token = customerToken()
    const forbidden = expect.objectContaining({ status: 403, code: 'FORBIDDEN' })
    expect(() => createProduct(token, NEW_PRODUCT)).toThrowError(forbidden)
    expect(() => updateProduct(token, 'prod-cable-clip', { price: 1 })).toThrowError(forbidden)
    expect(() => deleteProduct(token, 'prod-cable-clip')).toThrowError(forbidden)
    expect(() => listAllOrders(token)).toThrowError(forbidden)
    expect(() => updateOrderStatus(token, 'order-x', 'shipped')).toThrowError(forbidden)
    expect(() => stats(token)).toThrowError(forbidden)
  })
})

describe('admin products', () => {
  it('lists every product paginated (12 per page, 24 seeded)', () => {
    const page = listProducts(adminToken(), {})
    expect(page.total).toBe(24)
    expect(page.pageSize).toBe(12)
    expect(page.items).toHaveLength(12)
    expect(page.totalPages).toBe(2)
  })

  it('searches by name', () => {
    expect(listProducts(adminToken(), { search: 'aurora' }).total).toBe(1)
  })

  it('includes out-of-stock products', () => {
    const page = listProducts(adminToken(), { pageSize: 48 })
    expect(page.items.some((product) => product.id === 'prod-studio-mic' && product.stock === 0)).toBe(true)
  })

  it('creates a product that shows up in the public catalog', () => {
    const created = createProduct(adminToken(), NEW_PRODUCT)
    expect(created.id.startsWith('prod-')).toBe(true)
    expect(created.rating).toBe(0)
    expect(getProduct(created.id).name).toBe('Test Gadget')
  })

  it('updates a product partially', () => {
    const updated = updateProduct(adminToken(), 'prod-cable-clip', { price: 1.49, stock: 400 })
    expect(updated.price).toBe(1.49)
    expect(getProduct('prod-cable-clip').stock).toBe(400)
  })

  it('404s when updating an unknown product', () => {
    expect(() => updateProduct(adminToken(), 'prod-nope', { price: 1 })).toThrowError(
      expect.objectContaining({ status: 404, code: 'NOT_FOUND' }),
    )
  })

  it('deletes a product so the public catalog 404s', () => {
    deleteProduct(adminToken(), 'prod-cable-clip')
    expect(() => getProduct('prod-cable-clip')).toThrowError(
      expect.objectContaining({ status: 404, code: 'NOT_FOUND' }),
    )
  })

  it('404s when deleting an unknown product', () => {
    expect(() => deleteProduct(adminToken(), 'prod-nope')).toThrowError(
      expect.objectContaining({ status: 404, code: 'NOT_FOUND' }),
    )
  })
})

describe('admin orders', () => {
  it('lists orders from every user', () => {
    placeOrder()
    expect(listAllOrders(adminToken())).toHaveLength(1)
  })

  it('filters by status', () => {
    placeOrder()
    const token = adminToken()
    expect(listAllOrders(token, 'paid')).toHaveLength(1)
    expect(listAllOrders(token, 'shipped')).toEqual([])
  })

  it('allows the legal paid -> shipped transition', () => {
    const orderId = placeOrder()
    expect(updateOrderStatus(adminToken(), orderId, 'shipped').status).toBe('shipped')
  })

  it('walks the full graph paid -> shipped -> delivered', () => {
    const orderId = placeOrder()
    const token = adminToken()
    updateOrderStatus(token, orderId, 'shipped')
    expect(updateOrderStatus(token, orderId, 'delivered').status).toBe('delivered')
  })

  it('rejects paid -> delivered (skips shipped)', () => {
    const orderId = placeOrder()
    expect(() => updateOrderStatus(adminToken(), orderId, 'delivered')).toThrowError(
      expect.objectContaining({ status: 400, code: 'VALIDATION_ERROR' }),
    )
  })

  it('allows cancelling a paid order and then treats it as terminal', () => {
    const orderId = placeOrder()
    const token = adminToken()
    expect(updateOrderStatus(token, orderId, 'cancelled').status).toBe('cancelled')
    expect(() => updateOrderStatus(token, orderId, 'shipped')).toThrowError(
      expect.objectContaining({ status: 400, code: 'VALIDATION_ERROR' }),
    )
  })

  it('404s for unknown orders', () => {
    expect(() => updateOrderStatus(adminToken(), 'order-ghost', 'shipped')).toThrowError(
      expect.objectContaining({ status: 404, code: 'NOT_FOUND' }),
    )
  })
})

describe('admin stats', () => {
  it('computes revenue, status counts, category revenue and top products', () => {
    placeOrder() // pulse earbuds 89.50 -> total 96.66, category audio
    const result = stats(adminToken())

    expect(result.orderCount).toBe(1)
    expect(result.totalRevenue).toBe(96.66)
    expect(result.ordersByStatus.paid).toBe(1)
    const audio = result.revenueByCategory.find((row) => row.category === 'audio')
    expect(audio?.revenue).toBe(89.5)
    expect(result.topProducts[0]).toMatchObject({ productId: 'prod-pulse-earbuds', unitsSold: 1 })
  })

  it('excludes cancelled orders from revenue but keeps them in ordersByStatus', () => {
    const orderId = placeOrder()
    const token = adminToken()
    updateOrderStatus(token, orderId, 'cancelled')
    const result = stats(token)
    expect(result.orderCount).toBe(0)
    expect(result.totalRevenue).toBe(0)
    expect(result.ordersByStatus.cancelled).toBe(1)
    expect(result.revenueByCategory).toEqual([])
    expect(result.topProducts).toEqual([])
  })

  it('sorts revenueByCategory by category name and caps topProducts at 5', () => {
    const token = customerToken()
    for (const productId of [
      'prod-aurora-headphones', // audio
      'prod-nova-smartwatch', // wearables
      'prod-apex-controller', // gaming
      'prod-lumen-bulbs', // smart-home
      'prod-cable-clip', // accessories
      'prod-hub-ultra', // accessories
    ]) {
      addItem(token, null, { productId, qty: 1 })
    }
    checkout(token, { shippingAddress: ADDRESS, payment: GOOD_CARD })

    const result = stats(adminToken())
    expect(result.revenueByCategory.map((row) => row.category)).toEqual([
      'accessories',
      'audio',
      'gaming',
      'smart-home',
      'wearables',
    ])
    expect(result.topProducts).toHaveLength(5)
  })

  it('is empty for a fresh store', () => {
    const result = stats(adminToken())
    expect(result).toEqual({
      totalRevenue: 0,
      orderCount: 0,
      ordersByStatus: {},
      revenueByCategory: [],
      topProducts: [],
    })
  })
})
