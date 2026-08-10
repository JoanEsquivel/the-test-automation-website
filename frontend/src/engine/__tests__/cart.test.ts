// ATDD: engine cart must mirror backend/app/routers/cart.py behavior 1:1.
import { beforeEach, describe, expect, it } from 'vitest'

import { login } from '../auth'
import {
  addItem,
  applyCoupon,
  createCart,
  getCart,
  mergeGuestCartIntoUser,
  removeCoupon,
  removeItem,
  updateItem,
} from '../cart'
import { resetAll } from '../store'

beforeEach(() => {
  localStorage.clear()
  resetAll()
})

function guestCart(): string {
  return createCart(null).cartId
}

describe('cart identity', () => {
  it('creates a guest cart with a cart- id', () => {
    expect(guestCart()).toMatch(/^cart-/)
  })

  it('reads an empty guest cart', () => {
    const cartId = guestCart()
    const cart = getCart(null, cartId)
    expect(cart.items).toEqual([])
    expect(cart.totals.total).toBe(0)
  })

  it('rejects requests without any identity with 401 UNAUTHORIZED', () => {
    expect(() => getCart(null, null)).toThrowError(
      expect.objectContaining({ status: 401, code: 'UNAUTHORIZED' }),
    )
  })

  it('rejects an unknown cart id with 401 UNAUTHORIZED', () => {
    expect(() => getCart(null, 'cart-ghost')).toThrowError(
      expect.objectContaining({ status: 401, code: 'UNAUTHORIZED' }),
    )
  })

  it('token wins: a logged-in user gets a user-bound cart', () => {
    const { token } = login({ email: 'customer@example.com', password: 'Password123!' })
    const created = createCart(token)
    expect(getCart(token, null).id).toBe(created.cartId)
    // creating again returns the same user cart
    expect(createCart(token).cartId).toBe(created.cartId)
  })
})

describe('cart items', () => {
  it('adds an item with correct line total', () => {
    const cartId = guestCart()
    const cart = addItem(null, cartId, { productId: 'prod-pulse-earbuds', qty: 2 })
    expect(cart.items[0]).toMatchObject({ productId: 'prod-pulse-earbuds', qty: 2, lineTotal: 179.0 })
  })

  it('increments qty when the same product is added again', () => {
    const cartId = guestCart()
    addItem(null, cartId, { productId: 'prod-cable-clip', qty: 1 })
    const cart = addItem(null, cartId, { productId: 'prod-cable-clip', qty: 3 })
    expect(cart.items).toHaveLength(1)
    expect(cart.items[0]!.qty).toBe(4)
  })

  it('rejects an out-of-stock product (prod-studio-mic, stock 0)', () => {
    expect(() => addItem(null, guestCart(), { productId: 'prod-studio-mic', qty: 1 })).toThrowError(
      expect.objectContaining({ status: 400, code: 'OUT_OF_STOCK' }),
    )
  })

  it('rejects qty beyond stock (6 of prod-quantum-headset, stock 5)', () => {
    expect(() =>
      addItem(null, guestCart(), { productId: 'prod-quantum-headset', qty: 6 }),
    ).toThrowError(expect.objectContaining({ status: 400, code: 'OUT_OF_STOCK' }))
  })

  it('404s for an unknown product', () => {
    expect(() => addItem(null, guestCart(), { productId: 'prod-ghost', qty: 1 })).toThrowError(
      expect.objectContaining({ status: 404, code: 'NOT_FOUND' }),
    )
  })

  it('updates quantity within 1-99', () => {
    const cartId = guestCart()
    addItem(null, cartId, { productId: 'prod-cable-clip', qty: 1 })
    const cart = updateItem(null, cartId, 'prod-cable-clip', 5)
    expect(cart.items[0]!.qty).toBe(5)
    expect(cart.items[0]!.lineTotal).toBe(4.95)
  })

  it('rejects qty outside 1-99 with VALIDATION_ERROR', () => {
    const cartId = guestCart()
    addItem(null, cartId, { productId: 'prod-cable-clip', qty: 1 })
    for (const qty of [0, 100]) {
      expect(() => updateItem(null, cartId, 'prod-cable-clip', qty)).toThrowError(
        expect.objectContaining({ status: 400, code: 'VALIDATION_ERROR' }),
      )
    }
  })

  it('rejects updating a product that is not in the cart with 404', () => {
    expect(() => updateItem(null, guestCart(), 'prod-cable-clip', 2)).toThrowError(
      expect.objectContaining({ status: 404, code: 'NOT_FOUND' }),
    )
  })

  it('guards update against stock', () => {
    const cartId = guestCart()
    addItem(null, cartId, { productId: 'prod-quantum-headset', qty: 1 })
    expect(() => updateItem(null, cartId, 'prod-quantum-headset', 6)).toThrowError(
      expect.objectContaining({ status: 400, code: 'OUT_OF_STOCK' }),
    )
  })

  it('removes an item', () => {
    const cartId = guestCart()
    addItem(null, cartId, { productId: 'prod-cable-clip', qty: 1 })
    expect(removeItem(null, cartId, 'prod-cable-clip').items).toEqual([])
  })
})

describe('cart coupons', () => {
  it('applies and removes a coupon', () => {
    const cartId = guestCart()
    addItem(null, cartId, { productId: 'prod-pulse-earbuds', qty: 1 })
    const withCoupon = applyCoupon(null, cartId, 'WELCOME10')
    expect(withCoupon.couponCode).toBe('WELCOME10')
    expect(withCoupon.totals.discount).toBe(8.95)
    expect(withCoupon.totals.total).toBe(86.99)
    const without = removeCoupon(null, cartId)
    expect(without.couponCode).toBeNull()
    expect(without.totals.total).toBe(96.66)
  })

  it('validates the coupon against the current subtotal', () => {
    const cartId = guestCart()
    addItem(null, cartId, { productId: 'prod-cable-clip', qty: 1 })
    expect(() => applyCoupon(null, cartId, 'SAVE20')).toThrowError(
      expect.objectContaining({ status: 400, code: 'COUPON_MIN_SUBTOTAL' }),
    )
  })
})

describe('mergeGuestCartIntoUser', () => {
  it('combines quantities into the user cart and deletes the guest cart', () => {
    const { token, user } = login({ email: 'customer@example.com', password: 'Password123!' })
    addItem(token, null, { productId: 'prod-cable-clip', qty: 2 })

    const guestId = guestCart()
    addItem(null, guestId, { productId: 'prod-cable-clip', qty: 3 })
    addItem(null, guestId, { productId: 'prod-fit-band', qty: 1 })

    mergeGuestCartIntoUser(guestId, user.id)

    const merged = getCart(token, null)
    expect(merged.items).toHaveLength(2)
    expect(merged.items.find((i) => i.productId === 'prod-cable-clip')!.qty).toBe(5)
    expect(merged.items.find((i) => i.productId === 'prod-fit-band')!.qty).toBe(1)
    // guest cart is gone
    expect(() => getCart(null, guestId)).toThrowError(
      expect.objectContaining({ status: 401, code: 'UNAUTHORIZED' }),
    )
  })

  it('is a no-op for an unknown guest cart id', () => {
    const { token, user } = login({ email: 'customer@example.com', password: 'Password123!' })
    addItem(token, null, { productId: 'prod-cable-clip', qty: 1 })
    mergeGuestCartIntoUser('cart-ghost', user.id)
    expect(getCart(token, null).items).toHaveLength(1)
  })
})
