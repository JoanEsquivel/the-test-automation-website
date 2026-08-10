/** Engine coupons — mirrors POST /api/coupons/validate (backend/app/routers/cart.py). */

import type { CouponValidation } from '@/api/types'
import { couponDiscount, validateCoupon } from './commerce'

export function validateCouponForSubtotal(code: string, subtotal: number): CouponValidation {
  const coupon = validateCoupon(code, subtotal)
  return {
    valid: true,
    type: coupon.type,
    value: coupon.value,
    discount: couponDiscount(coupon, subtotal),
  }
}
