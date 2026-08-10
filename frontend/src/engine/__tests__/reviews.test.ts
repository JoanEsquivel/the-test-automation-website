// ATDD: engine reviews must mirror backend/app/routers/reviews.py behavior 1:1.
import { beforeEach, describe, expect, it } from 'vitest'

import { login } from '../auth'
import { getProduct, listReviews } from '../catalog'
import { createReview } from '../reviews'
import { resetAll } from '../store'

beforeEach(() => {
  localStorage.clear()
  resetAll()
})

function token(): string {
  return login({ email: 'customer@example.com', password: 'Password123!' }).token
}

describe('createReview', () => {
  it('creates a review carrying the author name and updates the average', () => {
    const t = token()
    const before = getProduct('prod-cable-clip').rating
    const review = createReview(t, 'prod-cable-clip', { rating: 5, title: 'Great', body: 'Holds cables.' })
    expect(review.authorName).toBe('Casey Customer')
    expect(review.productId).toBe('prod-cable-clip')
    expect(listReviews('prod-cable-clip').some((r) => r.id === review.id)).toBe(true)
    expect(getProduct('prod-cable-clip').rating).not.toBe(before)
  })

  it('rejects ratings outside 1-5 or non-integers with VALIDATION_ERROR', () => {
    const t = token()
    for (const rating of [0, 6, 2.5]) {
      expect(() =>
        createReview(t, 'prod-cable-clip', { rating, title: 'x', body: 'y' }),
      ).toThrowError(expect.objectContaining({ status: 400, code: 'VALIDATION_ERROR' }))
    }
  })

  it('404s for unknown products', () => {
    expect(() => createReview(token(), 'prod-ghost', { rating: 4, title: 'x', body: 'y' })).toThrowError(
      expect.objectContaining({ status: 404, code: 'NOT_FOUND' }),
    )
  })

  it('requires authentication', () => {
    expect(() => createReview(null, 'prod-cable-clip', { rating: 4, title: 'x', body: 'y' })).toThrowError(
      expect.objectContaining({ status: 401, code: 'UNAUTHORIZED' }),
    )
  })
})
