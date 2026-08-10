/** Engine commerce math — mirrors backend/app/services/commerce.py 1:1.
 * The math is NORMATIVE (docs/02-specs/api-contract.md): identical in both modes.
 */

import type { CartItem, Coupon, Totals } from '@/api/types'
import { EngineError } from './errors'
import { db } from './store'

export const FREE_SHIPPING_THRESHOLD = 50
export const SHIPPING_FLAT = 4.99
export const TAX_RATE = 0.08

/** Same rounding as the backend: round(value + 1e-9, 2). */
export function round2(value: number): number {
  return Math.round((value + 1e-9) * 100) / 100
}

export function couponDiscount(coupon: Coupon, subtotal: number): number {
  if (coupon.type === 'percent') {
    return round2((subtotal * coupon.value) / 100)
  }
  return round2(Math.min(coupon.value, subtotal))
}

export function validateCoupon(code: string, subtotal: number): Coupon {
  const coupon = db.coupons.find((c) => c.code === code)
  if (!coupon || !coupon.active) {
    throw new EngineError(400, 'COUPON_INVALID', `Coupon '${code}' is not valid.`)
  }
  if (new Date(coupon.expiresAt).getTime() < Date.now()) {
    throw new EngineError(400, 'COUPON_EXPIRED', `Coupon '${code}' has expired.`)
  }
  if (subtotal < coupon.minSubtotal) {
    throw new EngineError(
      400,
      'COUPON_MIN_SUBTOTAL',
      `Coupon '${code}' requires a subtotal of at least $${coupon.minSubtotal.toFixed(2)}.`,
    )
  }
  return coupon
}

export function computeTotals(items: CartItem[], couponCode: string | null): Totals {
  const subtotal = round2(items.reduce((sum, item) => sum + item.lineTotal, 0))
  let discount = 0
  if (couponCode && items.length > 0) {
    const coupon = db.coupons.find((c) => c.code === couponCode)
    if (coupon) discount = couponDiscount(coupon, subtotal)
  }
  const discounted = round2(subtotal - discount)
  const shipping = items.length === 0 ? 0 : discounted >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT
  const tax = round2(discounted * TAX_RATE)
  const total = round2(discounted + shipping + tax)
  return { subtotal, discount, shipping, tax, total }
}

export function luhnValid(digits: string): boolean {
  let total = 0
  const reversed = [...digits].reverse()
  for (let index = 0; index < reversed.length; index += 1) {
    let digit = Number(reversed[index])
    if (index % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    total += digit
  }
  return total % 10 === 0
}
