// ATDD: engine orders must mirror backend/app/routers/orders.py behavior 1:1.
import { beforeEach, describe, expect, it } from 'vitest'

import type { AddressInput, PaymentInput } from '@/api/types'
import { login, register } from '../auth'
import { addItem, applyCoupon, getCart } from '../cart'
import { checkout, getOrder, listOrders } from '../orders'
import { db, resetAll } from '../store'

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

function customerToken(): string {
  return login({ email: 'customer@example.com', password: 'Password123!' }).token
}

beforeEach(() => {
  localStorage.clear()
  resetAll()
})

describe('checkout', () => {
  it('places an order: sequential number, paid status, snapshot, stock decrement, cart cleared', () => {
    const token = customerToken()
    addItem(token, null, { productId: 'prod-pulse-earbuds', qty: 1 })

    const order = checkout(token, { shippingAddress: ADDRESS, payment: GOOD_CARD })

    expect(order.orderNumber).toBe('TAW-2026-0001')
    expect(order.status).toBe('paid')
    expect(order.paymentMethod).toEqual({ type: 'card', last4: '1111' })
    expect(order.items).toHaveLength(1)
    expect(order.shippingAddress).toMatchObject({ street: '742 Evergreen Terrace' })
    expect(order.totals).toEqual({ subtotal: 89.5, discount: 0, shipping: 0, tax: 7.16, total: 96.66 })
    // stock decremented 60 -> 59
    expect(db.products.find((p) => p.id === 'prod-pulse-earbuds')!.stock).toBe(59)
    // cart emptied
    const cart = getCart(token, null)
    expect(cart.items).toEqual([])
    expect(cart.couponCode).toBeNull()
  })

  it('numbers orders sequentially', () => {
    const token = customerToken()
    addItem(token, null, { productId: 'prod-cable-clip', qty: 1 })
    checkout(token, { shippingAddress: ADDRESS, payment: GOOD_CARD })
    addItem(token, null, { productId: 'prod-cable-clip', qty: 1 })
    const second = checkout(token, { shippingAddress: ADDRESS, payment: GOOD_CARD })
    expect(second.orderNumber).toBe('TAW-2026-0002')
  })

  it('snapshots coupon totals (WELCOME10 on 89.50 -> 86.99)', () => {
    const token = customerToken()
    addItem(token, null, { productId: 'prod-pulse-earbuds', qty: 1 })
    applyCoupon(token, null, 'WELCOME10')
    const order = checkout(token, { shippingAddress: ADDRESS, payment: GOOD_CARD })
    expect(order.totals.discount).toBe(8.95)
    expect(order.totals.total).toBe(86.99)
  })

  it('declines cards ending 0000 and leaves the cart intact', () => {
    const token = customerToken()
    addItem(token, null, { productId: 'prod-pulse-earbuds', qty: 1 })
    expect(() =>
      checkout(token, {
        shippingAddress: ADDRESS,
        payment: { ...GOOD_CARD, cardNumber: '4000 0000 0000 0000' },
      }),
    ).toThrowError(expect.objectContaining({ status: 400, code: 'PAYMENT_DECLINED' }))
    expect(getCart(token, null).items).toHaveLength(1)
    expect(db.products.find((p) => p.id === 'prod-pulse-earbuds')!.stock).toBe(60)
  })

  it('rejects non-Luhn card numbers with VALIDATION_ERROR', () => {
    const token = customerToken()
    addItem(token, null, { productId: 'prod-cable-clip', qty: 1 })
    expect(() =>
      checkout(token, {
        shippingAddress: ADDRESS,
        payment: { ...GOOD_CARD, cardNumber: '4111 1111 1111 1112' },
      }),
    ).toThrowError(expect.objectContaining({ status: 400, code: 'VALIDATION_ERROR' }))
  })

  it('rejects expired cards with VALIDATION_ERROR', () => {
    const token = customerToken()
    addItem(token, null, { productId: 'prod-cable-clip', qty: 1 })
    expect(() =>
      checkout(token, { shippingAddress: ADDRESS, payment: { ...GOOD_CARD, expiry: '01/20' } }),
    ).toThrowError(expect.objectContaining({ status: 400, code: 'VALIDATION_ERROR' }))
  })

  it('rejects malformed card numbers and cvc/expiry formats', () => {
    const token = customerToken()
    addItem(token, null, { productId: 'prod-cable-clip', qty: 1 })
    const bads: Partial<PaymentInput>[] = [
      { cardNumber: '1234' },
      { cvc: '12' },
      { expiry: 'nope' },
    ]
    for (const bad of bads) {
      expect(() =>
        checkout(token, { shippingAddress: ADDRESS, payment: { ...GOOD_CARD, ...bad } }),
      ).toThrowError(expect.objectContaining({ status: 400, code: 'VALIDATION_ERROR' }))
    }
  })

  it('rejects an empty cart with EMPTY_CART', () => {
    const token = customerToken()
    expect(() => checkout(token, { shippingAddress: ADDRESS, payment: GOOD_CARD })).toThrowError(
      expect.objectContaining({ status: 400, code: 'EMPTY_CART' }),
    )
  })
})

describe('listOrders / getOrder', () => {
  it('lists own orders newest first', () => {
    const token = customerToken()
    addItem(token, null, { productId: 'prod-cable-clip', qty: 1 })
    checkout(token, { shippingAddress: ADDRESS, payment: GOOD_CARD })
    addItem(token, null, { productId: 'prod-cable-clip', qty: 1 })
    checkout(token, { shippingAddress: ADDRESS, payment: GOOD_CARD })
    const orders = listOrders(token)
    expect(orders.map((o) => o.orderNumber)).toEqual(['TAW-2026-0002', 'TAW-2026-0001'])
  })

  it('hides other users orders (404) but allows the admin', () => {
    const token = customerToken()
    addItem(token, null, { productId: 'prod-cable-clip', qty: 1 })
    const order = checkout(token, { shippingAddress: ADDRESS, payment: GOOD_CARD })

    const stranger = register({ email: 'other@example.com', password: 'Secret123', name: 'Other' }).token
    expect(() => getOrder(stranger, order.id)).toThrowError(
      expect.objectContaining({ status: 404, code: 'NOT_FOUND' }),
    )

    const admin = login({ email: 'admin@example.com', password: 'Admin123!' }).token
    expect(getOrder(admin, order.id).id).toBe(order.id)
    expect(getOrder(token, order.id).id).toBe(order.id)
  })

  it('404s for unknown order ids', () => {
    expect(() => getOrder(customerToken(), 'order-ghost')).toThrowError(
      expect.objectContaining({ status: 404, code: 'NOT_FOUND' }),
    )
  })
})
