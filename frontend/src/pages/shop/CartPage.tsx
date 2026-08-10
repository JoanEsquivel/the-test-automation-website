import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { api } from '@/api/client'
import { errorMessage } from '@/api/errorMessage'
import type { CartItem, Product } from '@/api/types'
import { Banner } from '@/components/ui/Banner'
import { PageIntro } from '@/components/ui/PageIntro'
import { useToast } from '@/components/ui/Toast'
import { useCart } from '@/hooks/useCart'
import { useAuthStore } from '@/stores/auth'
import { CartLineItem } from './components/CartLineItem'
import { CouponForm } from './components/CouponForm'
import type { CouponFeedback } from './components/CouponForm'
import { ListSkeleton } from './components/Skeletons'
import { TotalsBox } from './components/TotalsBox'

const CHECKOUT_PATH = '/shop/checkout'

export default function CartPage() {
  const { cart, loading, error, updateItem, removeItem, applyCoupon, removeCoupon } = useCart({ autoLoad: true })
  const [products, setProducts] = useState<Record<string, Product>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [coupon, setCoupon] = useState<CouponFeedback | null>(null)
  const token = useAuthStore((state) => state.token)
  const toast = useToast()

  const items = cart?.items ?? []
  // A stable dependency for the lookup effect below (`items` is a fresh array
  // on every render, which would restart the effect forever).
  const itemIds = items.map((item) => item.productId).join(',')

  // Line art and stock caps come from the catalog; the cart payload carries only
  // the pricing snapshot. A failed lookup degrades to a generic emoji.
  useEffect(() => {
    const missing = (itemIds === '' ? [] : itemIds.split(',')).filter((id) => !(id in products))
    if (missing.length === 0) return
    let active = true
    void Promise.allSettled(missing.map((id) => api.catalog.product(id))).then((results) => {
      if (!active) return
      const fetched: Record<string, Product> = {}
      for (const result of results) {
        if (result.status === 'fulfilled') fetched[result.value.id] = result.value
      }
      if (Object.keys(fetched).length > 0) setProducts((current) => ({ ...current, ...fetched }))
    })
    return () => {
      active = false
    }
  }, [itemIds, products])

  async function handleQtyChange(productId: string, qty: number) {
    setBusyId(productId)
    try {
      await updateItem(productId, qty)
    } catch (cause) {
      toast({ tone: 'danger', message: errorMessage(cause, 'The quantity could not be updated.') })
    } finally {
      setBusyId(null)
    }
  }

  async function handleRemove(item: CartItem) {
    setBusyId(item.productId)
    try {
      await removeItem(item.productId)
      toast({ tone: 'success', message: `${item.name} removed from your cart.` })
    } catch (cause) {
      toast({ tone: 'danger', message: errorMessage(cause, 'The item could not be removed.') })
    } finally {
      setBusyId(null)
    }
  }

  async function handleApplyCoupon(code: string) {
    try {
      await applyCoupon(code)
      setCoupon({ tone: 'success', message: `Coupon '${code}' applied to your order.` })
      toast({ tone: 'success', message: `Coupon '${code}' applied.` })
    } catch (cause) {
      // The exact COUPON_* message from the contract is what the banner shows.
      setCoupon({ tone: 'danger', message: errorMessage(cause, 'The coupon could not be applied.') })
    }
  }

  async function handleRemoveCoupon() {
    try {
      await removeCoupon()
      setCoupon({ tone: 'success', message: 'Coupon removed.' })
    } catch (cause) {
      setCoupon({ tone: 'danger', message: errorMessage(cause, 'The coupon could not be removed.') })
    }
  }

  const checkoutHref = token ? CHECKOUT_PATH : `/account/login?returnTo=${encodeURIComponent(CHECKOUT_PATH)}`

  return (
    <div className="space-y-8">
      <PageIntro
        title="Cart"
        what="Your basket, priced by the same normative math the API uses: subtotal, coupon discount, shipping (free over $50), 8% tax and the grand total. Guests get a cart too — it lives under an X-Cart-Id header and merges into your account when you log in."
        how="Change quantities with the steppers, remove lines, then try a coupon: WELCOME10 works, SAVE20 needs a $100 subtotal, EXPIRED50 and DISABLED5 always fail. Every response — success or error — is shown verbatim in the coupon banner."
      />

      {error && (
        <Banner tone="danger" data-testid="cart-error">
          {error}
        </Banner>
      )}

      {loading && <ListSkeleton rows={3} testId="cart-skeleton" />}

      {!loading && items.length === 0 && (
        <div
          data-testid="empty-cart"
          className="rounded-2xl border border-dashed border-ink-600 bg-ink-900 p-10 text-center"
        >
          <p aria-hidden="true" className="text-4xl">
            🛒
          </p>
          <h2 className="font-display mt-3 text-lg font-bold">Your cart is empty</h2>
          <p className="mt-1 text-sm text-mist-400">Add a product from the catalog and it will show up here.</p>
          <Link
            to="/shop/catalog"
            data-testid="empty-cart-catalog-link"
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-volt-500 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-volt-400"
          >
            Browse the catalog
          </Link>
        </div>
      )}

      {!loading && cart && items.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start">
          <section aria-label="Cart items" className="space-y-4">
            <p data-testid="cart-item-count" className="text-sm text-mist-400" aria-live="polite">
              {items.length} line(s) in your cart
            </p>
            {items.map((item) => (
              <CartLineItem
                key={item.productId}
                item={item}
                product={products[item.productId]}
                busy={busyId === item.productId}
                onQtyChange={handleQtyChange}
                onRemove={handleRemove}
              />
            ))}

            <CouponForm
              appliedCode={cart.couponCode}
              busy={busyId !== null}
              onApply={handleApplyCoupon}
              onRemove={handleRemoveCoupon}
              feedback={coupon}
              onFeedbackChange={setCoupon}
            />
          </section>

          <TotalsBox totals={cart.totals} couponCode={cart.couponCode}>
            <Link
              to={checkoutHref}
              data-testid="proceed-to-checkout"
              className="inline-flex w-full items-center justify-center rounded-xl bg-volt-500 px-6 py-3 text-base font-semibold text-ink-950 transition-colors hover:bg-volt-400"
            >
              Proceed to checkout
            </Link>
            {!token && (
              <p className="text-xs text-mist-500">
                Checkout needs an account — you will be sent to the login page and back here afterwards.
              </p>
            )}
            <Link
              to="/shop/catalog"
              data-testid="continue-shopping"
              className="block text-center text-sm font-medium text-mist-300 hover:text-mist-50"
            >
              Continue shopping
            </Link>
          </TotalsBox>
        </div>
      )}
    </div>
  )
}
