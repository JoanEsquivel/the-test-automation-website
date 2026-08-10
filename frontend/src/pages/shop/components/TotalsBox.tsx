import type { ReactNode } from 'react'

import type { Totals } from '@/api/types'
import { formatMoney } from '../format'

/** Normative free-shipping threshold (docs/02-specs/api-contract.md). */
const FREE_SHIPPING_THRESHOLD = 50

interface TotalsBoxProps {
  totals: Totals
  /** Rendered next to the discount row when a coupon is active. */
  couponCode?: string | null
  title?: string
  /** Call-to-action area below the rows (e.g. "Proceed to checkout"). */
  children?: ReactNode
}

function Row({
  label,
  testId,
  value,
  hint,
  emphasis = false,
}: {
  label: ReactNode
  testId: string
  value: ReactNode
  hint?: ReactNode
  emphasis?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className={emphasis ? 'font-display text-base font-bold text-mist-50' : 'text-sm text-mist-300'}>
        {label}
        {hint && <span className="mt-0.5 block text-xs font-normal text-mist-500">{hint}</span>}
      </span>
      <span
        data-testid={testId}
        className={
          emphasis ? 'font-display text-xl font-bold text-mist-50' : 'text-sm font-medium tabular-nums text-mist-100'
        }
      >
        {value}
      </span>
    </div>
  )
}

/**
 * The one totals readout of the store — shared by the cart, the checkout review
 * step and the order detail page, so the normative math (api-contract.md) is
 * only ever rendered in a single place.
 */
export function TotalsBox({ totals, couponCode, title = 'Order summary', children }: TotalsBoxProps) {
  const freeShipping = totals.shipping === 0

  return (
    <section
      data-testid="totals-box"
      aria-label={title}
      className="rounded-2xl border border-ink-700 bg-ink-900 p-6"
    >
      <h2 className="font-display text-base font-bold text-mist-50">{title}</h2>

      <div className="mt-4 divide-y divide-ink-800">
        <Row label="Subtotal" testId="totals-subtotal" value={formatMoney(totals.subtotal)} />

        {totals.discount > 0 && (
          <Row
            label={couponCode ? `Discount (${couponCode})` : 'Discount'}
            testId="totals-discount"
            value={<span className="text-emerald-300">−{formatMoney(totals.discount)}</span>}
          />
        )}

        <Row
          label="Shipping"
          testId="totals-shipping"
          hint={`Free over ${formatMoney(FREE_SHIPPING_THRESHOLD)}`}
          value={freeShipping ? <span className="text-emerald-300">Free</span> : formatMoney(totals.shipping)}
        />

        <Row label="Tax (8%)" testId="totals-tax" value={formatMoney(totals.tax)} />

        <Row label="Total" testId="totals-total" value={formatMoney(totals.total)} emphasis />
      </div>

      {children && <div className="mt-5 space-y-3">{children}</div>}
    </section>
  )
}
