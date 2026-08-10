/** Values that are normative for the app — kept in one place so a spec never
 * hard-codes a magic string that the application could change underneath it.
 * Sources: frontend/src/api/mode.ts, shared/seed/*.json,
 * docs/02-specs/api-contract.md and docs/02-specs/ecommerce-spec.md. */

export type ApiMode = 'backend' | 'browser'

/** frontend/src/api/mode.ts */
export const MODE_KEY = 'taw:apiMode'

export const CUSTOMER = {
  email: 'customer@example.com',
  password: 'Password123!',
  name: 'Casey Customer',
} as const

export const ADMIN = {
  email: 'admin@example.com',
  password: 'Admin123!',
  name: 'Alex Admin',
} as const

export const CARDS = {
  approved: '4111 1111 1111 1111',
  declined: '4000 0000 0000 0000',
  expiry: '12/30',
  cvc: '123',
  holder: 'Casey Customer',
} as const

/**
 * The checkout fixture product. Chosen deliberately:
 * - 500 units in stock, so backend mode (whose stock is process-wide and shared
 *   between parallel workers and repeated runs) can never run out;
 * - $0.99, which is under the $50 free-shipping threshold, so the flat $4.99
 *   shipping rule and the 8% tax are both exercised.
 */
export const FIXTURE_PRODUCT = {
  id: 'prod-cable-clip',
  name: 'Sticky Cable Clip',
  price: 0.99,
} as const

/** docs/02-specs/api-contract.md — the normative money rules, mirrored by
 * frontend/src/engine/commerce.ts and backend/app/services/commerce.py. */
export const FREE_SHIPPING_THRESHOLD = 50
export const SHIPPING_FLAT = 4.99
export const TAX_RATE = 0.08

const MONEY = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function formatMoney(amount: number): string {
  return MONEY.format(amount)
}

/** Same rounding as both engines: round(value + 1e-9, 2). */
function round2(value: number): number {
  return Math.round((value + 1e-9) * 100) / 100
}

export interface ExpectedTotals {
  subtotal: string
  shipping: string
  tax: string
  total: string
}

/** Recomputes the normative totals independently of the app, so the assertion
 * is a real check rather than an echo of whatever the UI rendered. */
export function expectedTotals(unitPrice: number, qty: number): ExpectedTotals {
  const subtotal = round2(unitPrice * qty)
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT
  const tax = round2(subtotal * TAX_RATE)
  const total = round2(subtotal + shipping + tax)
  return {
    subtotal: formatMoney(subtotal),
    shipping: shipping === 0 ? 'Free' : formatMoney(shipping),
    tax: formatMoney(tax),
    total: formatMoney(total),
  }
}

/** `TAW-2026-0001` — a zero-padded per-process counter. Generated identically by
 * frontend/src/engine/orders.ts and backend/app/store/memory.py. */
export const ORDER_NUMBER_PATTERN = /^TAW-2026-\d{4}$/
