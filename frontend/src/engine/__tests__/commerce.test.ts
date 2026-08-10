// ATDD: engine commerce math must mirror backend/tests/test_cart.py TestTotalsMath.
import { beforeEach, describe, expect, it } from 'vitest'

import { computeTotals, couponDiscount, luhnValid, round2, validateCoupon } from '../commerce'
import { resetAll } from '../store'
import type { CartItem } from '@/api/types'

beforeEach(() => {
  localStorage.clear()
  resetAll()
})

function item(unitPrice: number, qty = 1): CartItem {
  return {
    productId: 'prod-x',
    name: 'X',
    unitPrice,
    qty,
    lineTotal: Math.round(unitPrice * qty * 100) / 100,
  }
}

describe('round2', () => {
  it('rounds half-up like the backend (round(v + 1e-9, 2))', () => {
    expect(round2(0.125)).toBe(0.13)
    expect(round2(2.675)).toBe(2.68)
    expect(round2(89.5 * 0.08)).toBe(7.16)
  })
})

describe('computeTotals', () => {
  it('charges flat shipping under $50 (0.99 cable clip case)', () => {
    const totals = computeTotals([item(0.99)], null)
    expect(totals).toEqual({ subtotal: 0.99, discount: 0, shipping: 4.99, tax: 0.08, total: 6.06 })
  })

  it('gives free shipping at $50+ (89.50 earbuds case)', () => {
    const totals = computeTotals([item(89.5)], null)
    expect(totals).toEqual({ subtotal: 89.5, discount: 0, shipping: 0, tax: 7.16, total: 96.66 })
  })

  it('applies WELCOME10 percent coupon (89.50 case)', () => {
    const totals = computeTotals([item(89.5)], 'WELCOME10')
    expect(totals.discount).toBe(8.95)
    expect(totals.total).toBe(86.99)
  })

  it('returns all-zero totals for an empty cart even with a coupon', () => {
    expect(computeTotals([], 'WELCOME10')).toEqual({
      subtotal: 0,
      discount: 0,
      shipping: 0,
      tax: 0,
      total: 0,
    })
  })
})

describe('couponDiscount', () => {
  it('caps fixed coupons at the subtotal', () => {
    expect(
      couponDiscount({ code: 'SAVE20', type: 'fixed', value: 20, minSubtotal: 0, expiresAt: '2030-01-01T00:00:00Z', active: true }, 12.5),
    ).toBe(12.5)
  })
})

describe('validateCoupon', () => {
  it('accepts WELCOME10 at any subtotal', () => {
    expect(validateCoupon('WELCOME10', 1).code).toBe('WELCOME10')
  })

  it('rejects SAVE20 under $100 with COUPON_MIN_SUBTOTAL', () => {
    expect(() => validateCoupon('SAVE20', 99.99)).toThrowError(
      expect.objectContaining({ status: 400, code: 'COUPON_MIN_SUBTOTAL' }),
    )
  })

  it('rejects EXPIRED50 with COUPON_EXPIRED', () => {
    expect(() => validateCoupon('EXPIRED50', 500)).toThrowError(
      expect.objectContaining({ status: 400, code: 'COUPON_EXPIRED' }),
    )
  })

  it('rejects unknown and disabled coupons with COUPON_INVALID', () => {
    for (const code of ['NOPE', 'DISABLED5']) {
      expect(() => validateCoupon(code, 500)).toThrowError(
        expect.objectContaining({ status: 400, code: 'COUPON_INVALID' }),
      )
    }
  })
})

describe('coupons.validateCouponForSubtotal (POST /coupons/validate)', () => {
  it('returns valid + computed discount for a good coupon', async () => {
    const { validateCouponForSubtotal } = await import('../coupons')
    expect(validateCouponForSubtotal('WELCOME10', 89.5)).toEqual({
      valid: true,
      type: 'percent',
      value: 10,
      discount: 8.95,
    })
  })

  it('propagates COUPON_* errors', async () => {
    const { validateCouponForSubtotal } = await import('../coupons')
    expect(() => validateCouponForSubtotal('SAVE20', 10)).toThrowError(
      expect.objectContaining({ status: 400, code: 'COUPON_MIN_SUBTOTAL' }),
    )
  })
})

describe('luhnValid', () => {
  it('accepts the seeded success card', () => {
    expect(luhnValid('4111111111111111')).toBe(true)
  })

  it('rejects an off-by-one card', () => {
    expect(luhnValid('4111111111111112')).toBe(false)
  })
})
