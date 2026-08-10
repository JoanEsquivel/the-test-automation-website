import { useState } from 'react'
import type { FormEvent } from 'react'

import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'

export interface CouponFeedback {
  tone: 'success' | 'danger'
  message: string
}

interface CouponFormProps {
  /** Coupon currently attached to the cart, if any. */
  appliedCode: string | null
  busy?: boolean
  /** Resolves when the coupon was accepted; rejects with the API error. */
  onApply: (code: string) => Promise<void>
  onRemove: () => Promise<void>
  feedback: CouponFeedback | null
  onFeedbackChange: (feedback: CouponFeedback | null) => void
}

/**
 * Coupon entry for the cart. Every `COUPON_*` outcome from the API is surfaced
 * verbatim in the banner, so the exact contract message is testable.
 */
export function CouponForm({
  appliedCode,
  busy = false,
  onApply,
  onRemove,
  feedback,
  onFeedbackChange,
}: CouponFormProps) {
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      onFeedbackChange({ tone: 'danger', message: 'Enter a coupon code first.' })
      return
    }
    setSubmitting(true)
    try {
      await onApply(trimmed)
      setCode('')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove() {
    setSubmitting(true)
    try {
      await onRemove()
    } finally {
      setSubmitting(false)
    }
  }

  const disabled = busy || submitting

  return (
    <section
      data-testid="coupon-form"
      aria-label="Coupon code"
      className="rounded-2xl border border-ink-700 bg-ink-900 p-6"
    >
      <h2 className="font-display text-base font-bold text-mist-50">Coupon code</h2>
      <p className="mt-1 text-xs leading-relaxed text-mist-400">
        Try <code className="text-volt-300">WELCOME10</code> (10% off),{' '}
        <code className="text-volt-300">SAVE20</code> ($100+ subtotal),{' '}
        <code className="text-volt-300">EXPIRED50</code> or <code className="text-volt-300">DISABLED5</code> to see
        every error path.
      </p>

      {appliedCode ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span data-testid="applied-coupon" className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            {appliedCode} applied
          </span>
          <Button variant="secondary" size="sm" data-testid="remove-coupon" disabled={disabled} onClick={handleRemove}>
            {disabled ? 'Working…' : 'Remove coupon'}
          </Button>
        </div>
      ) : (
        <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={handleSubmit} noValidate>
          <div className="min-w-[12rem] flex-1">
            <label htmlFor="coupon-input" className="mb-1.5 block text-sm font-medium text-mist-200">
              Coupon code
            </label>
            <input
              id="coupon-input"
              data-testid="coupon-input"
              value={code}
              autoComplete="off"
              placeholder="WELCOME10"
              onChange={(event) => setCode(event.target.value)}
              className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm uppercase text-mist-50 placeholder:text-mist-500 focus:border-volt-400 focus:outline-none"
            />
          </div>
          <Button type="submit" data-testid="apply-coupon" disabled={disabled}>
            {disabled ? 'Applying…' : 'Apply'}
          </Button>
        </form>
      )}

      {feedback && (
        <div className="mt-4">
          <Banner tone={feedback.tone} data-testid="coupon-banner" onDismiss={() => onFeedbackChange(null)}>
            {feedback.message}
          </Banner>
        </div>
      )}
    </section>
  )
}
