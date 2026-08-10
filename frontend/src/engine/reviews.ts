/** Engine reviews — mirrors backend/app/routers/reviews.py behavior 1:1. */

import type { Review } from '@/api/types'
import { requireUser } from './auth'
import { EngineError } from './errors'
import { db, newId, nowIso } from './store'

export function createReview(
  token: string | null,
  productId: string,
  input: { rating: number; title: string; body: string },
): Review {
  const user = requireUser(token)
  if (!db.products.some((p) => p.id === productId)) {
    throw new EngineError(404, 'NOT_FOUND', `Product '${productId}' was not found.`)
  }
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new EngineError(400, 'VALIDATION_ERROR', 'rating: must be an integer between 1 and 5.')
  }
  const review: Review = {
    id: newId('rev'),
    productId,
    userId: user.id,
    authorName: user.name,
    rating: input.rating,
    title: input.title,
    body: input.body,
    createdAt: nowIso(),
  }
  db.reviews = [...db.reviews, review]
  return review
}
