/** Engine cart — mirrors backend/app/routers/cart.py behavior 1:1.
 * Identity resolution: Bearer token first (user-bound cart), then X-Cart-Id.
 */

import type { Cart, Totals } from '@/api/types'
import { optionalUser } from './auth'
import { computeTotals, round2, validateCoupon } from './commerce'
import { EngineError } from './errors'
import { db, newId, type EngineCart } from './store'

const ZERO_TOTALS: Totals = { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0 }

function blankCart(cartId: string, ownerUserId: string | null = null): EngineCart {
  return { id: cartId, ownerUserId, items: [], couponCode: null, totals: { ...ZERO_TOTALS } }
}

function toPublic(cart: EngineCart): Cart {
  return { id: cart.id, items: cart.items, couponCode: cart.couponCode, totals: cart.totals }
}

function refresh(cart: EngineCart): EngineCart {
  cart.totals = computeTotals(cart.items, cart.couponCode)
  return cart
}

/** Find (or lazily create) the user-bound cart inside a carts snapshot. */
function findUserCart(carts: EngineCart[], userId: string): EngineCart {
  const existing = carts.find((c) => c.ownerUserId === userId)
  if (existing) return existing
  const cart = blankCart(newId('cart'), userId)
  carts.push(cart)
  return cart
}

/** Resolve cart identity: token wins; then cartId; otherwise 401. */
function resolve(carts: EngineCart[], token: string | null, cartId: string | null): EngineCart {
  const user = optionalUser(token)
  if (user) return findUserCart(carts, user.id)
  const cart = cartId ? carts.find((c) => c.id === cartId) : undefined
  if (!cart) {
    throw new EngineError(401, 'UNAUTHORIZED', 'No cart identity. Send a Bearer token or an X-Cart-Id header.')
  }
  return cart
}

function requireQtyInRange(qty: number): void {
  if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
    throw new EngineError(400, 'VALIDATION_ERROR', 'qty: must be an integer between 1 and 99.')
  }
}

export function createCart(token: string | null): { cartId: string } {
  const carts = db.carts
  const user = optionalUser(token)
  const cart = user ? findUserCart(carts, user.id) : blankCart(newId('cart'))
  if (!user) carts.push(cart)
  db.carts = carts
  return { cartId: cart.id }
}

export function getCart(token: string | null, cartId: string | null): Cart {
  const carts = db.carts
  const cart = resolve(carts, token, cartId)
  db.carts = carts
  return toPublic(cart)
}

export function addItem(
  token: string | null,
  cartId: string | null,
  input: { productId: string; qty: number },
): Cart {
  requireQtyInRange(input.qty)
  const carts = db.carts
  const cart = resolve(carts, token, cartId)
  const product = db.products.find((p) => p.id === input.productId)
  if (!product) {
    throw new EngineError(404, 'NOT_FOUND', `Product '${input.productId}' was not found.`)
  }
  const existing = cart.items.find((i) => i.productId === input.productId)
  const newQty = (existing?.qty ?? 0) + input.qty
  if (newQty > product.stock) {
    throw new EngineError(400, 'OUT_OF_STOCK', `Only ${product.stock} unit(s) of '${product.name}' are in stock.`)
  }
  if (existing) {
    existing.qty = newQty
    existing.lineTotal = round2(existing.unitPrice * newQty)
  } else {
    cart.items.push({
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      qty: input.qty,
      lineTotal: round2(product.price * input.qty),
    })
  }
  refresh(cart)
  db.carts = carts
  return toPublic(cart)
}

export function updateItem(token: string | null, cartId: string | null, productId: string, qty: number): Cart {
  requireQtyInRange(qty)
  const carts = db.carts
  const cart = resolve(carts, token, cartId)
  const item = cart.items.find((i) => i.productId === productId)
  if (!item) {
    throw new EngineError(404, 'NOT_FOUND', `Product '${productId}' is not in the cart.`)
  }
  const product = db.products.find((p) => p.id === productId)
  if (product && qty > product.stock) {
    throw new EngineError(400, 'OUT_OF_STOCK', `Only ${product.stock} unit(s) in stock.`)
  }
  item.qty = qty
  item.lineTotal = round2(item.unitPrice * qty)
  refresh(cart)
  db.carts = carts
  return toPublic(cart)
}

export function removeItem(token: string | null, cartId: string | null, productId: string): Cart {
  const carts = db.carts
  const cart = resolve(carts, token, cartId)
  cart.items = cart.items.filter((i) => i.productId !== productId)
  refresh(cart)
  db.carts = carts
  return toPublic(cart)
}

export function applyCoupon(token: string | null, cartId: string | null, code: string): Cart {
  const carts = db.carts
  const cart = resolve(carts, token, cartId)
  const subtotal = cart.items.reduce((sum, i) => sum + i.lineTotal, 0)
  validateCoupon(code, subtotal)
  cart.couponCode = code
  refresh(cart)
  db.carts = carts
  return toPublic(cart)
}

export function removeCoupon(token: string | null, cartId: string | null): Cart {
  const carts = db.carts
  const cart = resolve(carts, token, cartId)
  cart.couponCode = null
  refresh(cart)
  db.carts = carts
  return toPublic(cart)
}

/** On login with an X-Cart-Id header: merge the guest cart into the user's cart,
 * then delete the guest cart (mirrors backend/app/routers/auth.py). */
export function mergeGuestCartIntoUser(guestCartId: string, userId: string): void {
  const carts = db.carts
  const guest = carts.find((c) => c.id === guestCartId)
  if (!guest || guest.ownerUserId) return
  const target = findUserCart(carts, userId)
  for (const guestItem of guest.items) {
    const existing = target.items.find((i) => i.productId === guestItem.productId)
    if (existing) {
      existing.qty += guestItem.qty
      existing.lineTotal = round2(existing.unitPrice * existing.qty)
    } else {
      target.items.push({ ...guestItem })
    }
  }
  refresh(target)
  db.carts = carts.filter((c) => c.id !== guestCartId)
}
