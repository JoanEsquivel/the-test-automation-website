import type { AddressInput, CartItem, Totals } from '@/api/types'
import { formatMoney } from '../format'
import { TotalsBox } from './TotalsBox'

interface CheckoutReviewProps {
  items: CartItem[]
  address: AddressInput | null
  last4: string
  cardHolder: string
  totals: Totals
  couponCode?: string | null
}

/** Read-only recap of everything the order is about to be placed with. */
export function CheckoutReview({ items, address, last4, cardHolder, totals, couponCode }: CheckoutReviewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:items-start">
      <div className="space-y-4">
        <section
          data-testid="review-items"
          aria-label="Items in this order"
          className="rounded-2xl border border-ink-700 bg-ink-900 p-6"
        >
          <h3 className="font-display text-base font-bold text-mist-50">Items</h3>
          <ul className="mt-3 divide-y divide-ink-800">
            {items.map((item) => (
              <li
                key={item.productId}
                data-testid={`review-item-${item.productId}`}
                className="flex items-baseline justify-between gap-4 py-2 text-sm"
              >
                <span className="text-mist-200">
                  {item.qty} × {item.name}
                </span>
                <span className="font-medium tabular-nums text-mist-100">{formatMoney(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <section
            data-testid="review-address"
            aria-label="Shipping address"
            className="rounded-2xl border border-ink-700 bg-ink-900 p-6 text-sm"
          >
            <h3 className="font-display text-base font-bold text-mist-50">Shipping to</h3>
            {address ? (
              <address className="mt-2 not-italic leading-relaxed text-mist-300">
                <span className="block text-mist-100">{address.fullName}</span>
                <span className="block">{address.street}</span>
                <span className="block">
                  {address.city} {address.zip}
                </span>
                <span className="block">{address.country}</span>
              </address>
            ) : (
              <p className="mt-2 text-mist-400">No address selected yet.</p>
            )}
          </section>

          <section
            data-testid="review-payment"
            aria-label="Payment method"
            className="rounded-2xl border border-ink-700 bg-ink-900 p-6 text-sm"
          >
            <h3 className="font-display text-base font-bold text-mist-50">Paying with</h3>
            <p className="mt-2 text-mist-300">
              Card ending in{' '}
              <span data-testid="review-last4" className="font-mono font-semibold text-mist-50">
                {last4}
              </span>
            </p>
            <p className="text-mist-400">{cardHolder}</p>
            <p className="mt-2 text-xs text-mist-500">
              Nothing is charged: the payment is simulated by the API exactly as the contract describes.
            </p>
          </section>
        </div>
      </div>

      <TotalsBox totals={totals} couponCode={couponCode} title="Order total" />
    </div>
  )
}
