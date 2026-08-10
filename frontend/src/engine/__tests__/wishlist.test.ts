// ATDD: engine wishlist must mirror backend/app/routers/wishlist.py behavior 1:1.
import { beforeEach, describe, expect, it } from 'vitest'

import { login } from '../auth'
import { resetAll } from '../store'
import { addToWishlist, listWishlist, removeFromWishlist } from '../wishlist'

beforeEach(() => {
  localStorage.clear()
  resetAll()
})

function token(): string {
  return login({ email: 'customer@example.com', password: 'Password123!' }).token
}

describe('wishlist', () => {
  it('starts empty and embeds product + rating after adding', () => {
    const t = token()
    expect(listWishlist(t).items).toEqual([])
    const entry = addToWishlist(t, 'prod-aurora-headphones')
    expect(entry.productId).toBe('prod-aurora-headphones')
    expect(entry.addedAt).toMatch(/Z$/)
    const { items } = listWishlist(t)
    expect(items).toHaveLength(1)
    expect(items[0]!.product.id).toBe('prod-aurora-headphones')
    expect(typeof items[0]!.product.rating).toBe('number')
  })

  it('rejects duplicates with 409 ALREADY_IN_WISHLIST', () => {
    const t = token()
    addToWishlist(t, 'prod-aurora-headphones')
    expect(() => addToWishlist(t, 'prod-aurora-headphones')).toThrowError(
      expect.objectContaining({ status: 409, code: 'ALREADY_IN_WISHLIST' }),
    )
  })

  it('404s for unknown products', () => {
    expect(() => addToWishlist(token(), 'prod-ghost')).toThrowError(
      expect.objectContaining({ status: 404, code: 'NOT_FOUND' }),
    )
  })

  it('removes entries (idempotent, returns nothing)', () => {
    const t = token()
    addToWishlist(t, 'prod-aurora-headphones')
    expect(removeFromWishlist(t, 'prod-aurora-headphones')).toBeUndefined()
    expect(listWishlist(t).items).toEqual([])
    // removing again is fine
    expect(removeFromWishlist(t, 'prod-aurora-headphones')).toBeUndefined()
  })

  it('requires authentication', () => {
    expect(() => listWishlist(null)).toThrowError(
      expect.objectContaining({ status: 401, code: 'UNAUTHORIZED' }),
    )
  })
})
