/** Engine orders — mirrors backend/app/routers/orders.py behavior 1:1,
 * including the simulated payment rules (docs/02-specs/api-contract.md).
 */

import type { AddressInput, Order, PaymentInput } from '@/api/types'
import { requireUser } from './auth'
import { luhnValid } from './commerce'
import { EngineError } from './errors'
import { db, newId, nowIso, type EngineCart } from './store'

/** Validate the simulated payment; returns the card's last4.
 * Order of checks mirrors the backend: length -> decline (*0000) -> Luhn -> CVC -> expiry. */
export function validatePayment(payment: PaymentInput): string {
  const digits = payment.cardNumber.replaceAll(' ', '')
  if (!/^\d{13,19}$/.test(digits)) {
    throw new EngineError(400, 'VALIDATION_ERROR', 'Card number must be 13-19 digits.')
  }
  if (digits.endsWith('0000')) {
    throw new EngineError(400, 'PAYMENT_DECLINED', 'The card was declined (test decline card).')
  }
  if (!luhnValid(digits)) {
    throw new EngineError(400, 'VALIDATION_ERROR', 'Card number failed validation (not Luhn-valid).')
  }
  if (!/^\d{3,4}$/.test(payment.cvc)) {
    throw new EngineError(400, 'VALIDATION_ERROR', 'CVC must be 3 or 4 digits.')
  }
  const match = /^(\d{1,2})\/(\d{2})$/.exec(payment.expiry)
  const month = match ? Number(match[1]) : 0
  if (!match || month < 1 || month > 12) {
    throw new EngineError(400, 'VALIDATION_ERROR', 'Expiry must be in MM/YY format.')
  }
  const year = 2000 + Number(match[2])
  const now = new Date()
  if (year * 12 + month < now.getUTCFullYear() * 12 + now.getUTCMonth() + 1) {
    throw new EngineError(400, 'VALIDATION_ERROR', 'The card has expired.')
  }
  return digits.slice(-4)
}

function nextOrderNumber(): string {
  const meta = db.meta
  const counter = meta.orderCounter + 1
  db.meta = { ...meta, orderCounter: counter }
  return `TAW-2026-${String(counter).padStart(4, '0')}`
}

export function checkout(
  token: string | null,
  input: { shippingAddress: AddressInput; payment: PaymentInput },
): Order {
  const user = requireUser(token)
  const carts = db.carts
  let cart = carts.find((c) => c.ownerUserId === user.id)
  if (!cart) {
    cart = {
      id: newId('cart'),
      ownerUserId: user.id,
      items: [],
      couponCode: null,
      totals: { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0 },
    } satisfies EngineCart
    carts.push(cart)
    db.carts = carts
  }
  if (cart.items.length === 0) {
    throw new EngineError(400, 'EMPTY_CART', 'Your cart is empty. Add items before checking out.')
  }

  // stock re-check before payment
  const products = db.products
  for (const item of cart.items) {
    const product = products.find((p) => p.id === item.productId)
    if (!product || item.qty > product.stock) {
      throw new EngineError(400, 'OUT_OF_STOCK', `'${item.name}' no longer has enough stock.`)
    }
  }

  const last4 = validatePayment(input.payment)

  const order: Order = {
    id: newId('order'),
    orderNumber: nextOrderNumber(),
    userId: user.id,
    items: cart.items.map((i) => ({ ...i })),
    shippingAddress: { ...input.shippingAddress },
    paymentMethod: { type: 'card', last4 },
    status: 'paid',
    totals: { ...cart.totals },
    createdAt: nowIso(),
  }
  db.orders = [...db.orders, order]

  for (const item of cart.items) {
    const product = products.find((p) => p.id === item.productId)!
    product.stock -= item.qty
  }
  db.products = products

  cart.items = []
  cart.couponCode = null
  cart.totals = { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0 }
  db.carts = carts

  return order
}

export function listOrders(token: string | null): Order[] {
  const user = requireUser(token)
  return db.orders
    .filter((o) => o.userId === user.id)
    .sort((a, b) => b.orderNumber.localeCompare(a.orderNumber))
}

export function getOrder(token: string | null, orderId: string): Order {
  const user = requireUser(token)
  const order = db.orders.find((o) => o.id === orderId)
  if (!order || (order.userId !== user.id && user.role !== 'admin')) {
    throw new EngineError(404, 'NOT_FOUND', `Order '${orderId}' was not found.`)
  }
  return order
}
