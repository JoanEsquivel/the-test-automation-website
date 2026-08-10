import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'

import type { Review } from '@/api/types'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { formatDate } from '../format'
import { StarRating } from './StarRating'

interface ReviewSectionProps {
  reviews: Review[]
  canWrite: boolean
  loginHref: string
  submitting: boolean
  error: string | null
  onSubmit: (input: { rating: number; title: string; body: string }) => Promise<void>
}

const FIELD =
  'w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-mist-50 placeholder:text-mist-500 focus:border-volt-400 focus:outline-none'

export function ReviewSection({ reviews, canWrite, loginHref, submitting, error, onSubmit }: ReviewSectionProps) {
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim() || !body.trim()) {
      setFieldError('A title and a review body are both required.')
      return
    }
    setFieldError(null)
    await onSubmit({ rating, title: title.trim(), body: body.trim() })
    setTitle('')
    setBody('')
    setRating(5)
  }

  return (
    <div className="space-y-6">
      {reviews.length === 0 ? (
        <p data-testid="reviews-empty" className="rounded-2xl border border-dashed border-ink-600 p-6 text-center text-sm text-mist-400">
          No reviews yet — be the first to write one.
        </p>
      ) : (
        <ul data-testid="reviews-list" className="space-y-4">
          {reviews.map((review) => (
            <li key={review.id} data-testid={`review-${review.id}`} className="rounded-2xl border border-ink-700 bg-ink-900 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-mist-50">{review.title}</p>
                <StarRating value={review.rating} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-mist-300">{review.body}</p>
              <p className="mt-2 text-xs text-mist-500">
                {review.authorName} · {formatDate(review.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {canWrite ? (
        <form data-testid="review-form" onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-ink-700 bg-ink-900 p-5">
          <h3 className="font-display text-base font-bold">Write a review</h3>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-mist-200">Your rating</legend>
            <div role="radiogroup" aria-label="Your rating" className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={`${value} star${value === 1 ? '' : 's'}`}
                  data-testid={`review-rating-${value}`}
                  onClick={() => setRating(value)}
                  className={`rounded px-1 text-2xl transition-colors ${value <= rating ? 'text-amber-300' : 'text-ink-600 hover:text-amber-200'}`}
                >
                  <span aria-hidden="true">★</span>
                </button>
              ))}
              <span data-testid="review-rating-value" className="ml-2 text-sm text-mist-400">
                {rating} / 5
              </span>
            </div>
          </fieldset>

          <div>
            <label htmlFor="review-title" className="mb-1.5 block text-sm font-medium text-mist-200">
              Title
            </label>
            <input
              id="review-title"
              data-testid="review-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={FIELD}
              placeholder="Sums up your experience"
            />
          </div>

          <div>
            <label htmlFor="review-body" className="mb-1.5 block text-sm font-medium text-mist-200">
              Your review
            </label>
            <textarea
              id="review-body"
              data-testid="review-body"
              value={body}
              rows={3}
              onChange={(event) => setBody(event.target.value)}
              className={FIELD}
              placeholder="What did you like or dislike?"
            />
          </div>

          {(fieldError ?? error) && (
            <Banner tone="danger" data-testid="review-error">
              {fieldError ?? error}
            </Banner>
          )}

          <Button type="submit" data-testid="review-submit" disabled={submitting}>
            {submitting ? 'Publishing…' : 'Publish review'}
          </Button>
        </form>
      ) : (
        <p data-testid="review-login-hint" className="rounded-2xl border border-ink-700 bg-ink-900 p-5 text-sm text-mist-300">
          <Link to={loginHref} className="font-semibold text-volt-400 hover:underline">
            Log in
          </Link>{' '}
          to write a review for this product.
        </p>
      )}
    </div>
  )
}
