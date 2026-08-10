import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { api } from '@/api/client'
import { errorCode, errorMessage } from '@/api/errorMessage'
import type { Address, AddressInput } from '@/api/types'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { PageIntro } from '@/components/ui/PageIntro'
import { useToast } from '@/components/ui/Toast'
import { useCart } from '@/hooks/useCart'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { EMPTY_ADDRESS, validateAddress } from './components/AddressForm'
import type { AddressErrors } from './components/AddressForm'
import { AddressPicker, NEW_ADDRESS_ID } from './components/AddressPicker'
import { CheckoutReview } from './components/CheckoutReview'
import { CheckoutStepper } from './components/CheckoutStepper'
import type { CheckoutStep } from './components/CheckoutStepper'
import { cardLast4, EMPTY_PAYMENT, PaymentForm, validatePayment } from './components/PaymentForm'
import type { PaymentErrors } from './components/PaymentForm'
import { ListSkeleton } from './components/Skeletons'

const HEADINGS: Record<CheckoutStep, string> = {
  shipping: 'Step 1 — Shipping address',
  payment: 'Step 2 — Payment details',
  review: 'Step 3 — Review and place your order',
}

function defaultAddressId(list: Address[]): string {
  return list.find((address) => address.isDefault)?.id ?? list[0]?.id ?? NEW_ADDRESS_ID
}

function toInput(address: Address): AddressInput {
  return {
    label: address.label,
    fullName: address.fullName,
    street: address.street,
    city: address.city,
    zip: address.zip,
    country: address.country,
    isDefault: address.isDefault,
  }
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const { cart, loading: cartLoading } = useCart({ autoLoad: true })

  const [step, setStep] = useState<CheckoutStep>('shipping')
  const [addresses, setAddresses] = useState<Address[]>(user?.addresses ?? [])
  const [selectedId, setSelectedId] = useState(() => defaultAddressId(user?.addresses ?? []))
  const [newAddress, setNewAddress] = useState<AddressInput>(EMPTY_ADDRESS)
  const [addressErrors, setAddressErrors] = useState<AddressErrors>({})
  const [payment, setPayment] = useState(EMPTY_PAYMENT)
  const [paymentErrors, setPaymentErrors] = useState<PaymentErrors>({})
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  // The address book may have changed since login: refresh it, but never block
  // the wizard on it (the session user already carries a usable copy).
  useEffect(() => {
    let active = true
    api.auth
      .me()
      .then((fresh) => {
        if (!active) return
        setUser(fresh)
        setAddresses(fresh.addresses)
        setSelectedId((current) =>
          current === NEW_ADDRESS_ID || fresh.addresses.some((address) => address.id === current)
            ? current
            : defaultAddressId(fresh.addresses),
        )
      })
      .catch(() => {
        // Offline / expired session: RequireAuth handles the redirect.
      })
    return () => {
      active = false
    }
  }, [setUser])

  // Accessibility: every step change moves focus to the new step heading.
  useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  const selectedAddress = addresses.find((address) => address.id === selectedId) ?? null
  const shippingAddress: AddressInput = selectedAddress ? toInput(selectedAddress) : newAddress
  const items = cart?.items ?? []
  const totals = cart?.totals ?? { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0 }

  function handleShippingContinue() {
    if (selectedId === NEW_ADDRESS_ID) {
      const errors = validateAddress(newAddress)
      setAddressErrors(errors)
      if (Object.keys(errors).length > 0) return
    }
    setError(null)
    setStep('payment')
  }

  function handlePaymentContinue() {
    const errors = validatePayment(payment)
    setPaymentErrors(errors)
    if (Object.keys(errors).length > 0) return
    setError(null)
    setStep('review')
  }

  async function handlePlaceOrder() {
    setPlacing(true)
    setError(null)
    try {
      const order = await api.orders.checkout({ shippingAddress, payment })
      useCartStore.getState().setItemCount(0)
      toast({ tone: 'success', message: `Order ${order.orderNumber} placed.` })
      navigate(`/shop/orders/${order.id}/confirmation`, { replace: true })
    } catch (cause) {
      const code = errorCode(cause)
      setError(errorMessage(cause, 'The order could not be placed.'))
      // A declined or malformed card sends the visitor back to fix it; the cart
      // is untouched by a failed checkout.
      if (code === 'PAYMENT_DECLINED' || code === 'VALIDATION_ERROR') setStep('payment')
      setPlacing(false)
    }
  }

  const cartIsEmpty = !cartLoading && cart !== null && items.length === 0

  return (
    <div className="space-y-8">
      <PageIntro
        title="Checkout"
        what="A three-step wizard: shipping, payment, review. The payment is simulated but deterministic. 4111 1111 1111 1111 is approved; any card ending in 0000 is declined."
        how="Pick a saved address or add one, enter the card (it masks itself as you type), then place the order from the review step. Errors come from the API and send you back to the step that can fix them, so the failure path is worth automating too."
      />

      <CheckoutStepper current={step} onNavigate={setStep} />

      {error && (
        <Banner tone="danger" data-testid="checkout-error">
          {error}
        </Banner>
      )}

      {cartIsEmpty ? (
        <div
          data-testid="checkout-empty-cart"
          className="rounded-2xl border border-dashed border-ink-600 bg-ink-900 p-10 text-center"
        >
          <p aria-hidden="true" className="text-4xl">
            🧾
          </p>
          <h2 className="font-display mt-3 text-lg font-bold">There is nothing to check out</h2>
          <p className="mt-1 text-sm text-mist-400">The cart is empty. Post this order anyway and the API answers EMPTY_CART.</p>
          <Link
            to="/shop/catalog"
            data-testid="checkout-catalog-link"
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-volt-500 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-volt-400"
          >
            Browse the catalog
          </Link>
        </div>
      ) : (
        <section
          data-testid="checkout-step"
          data-step={step}
          aria-labelledby="checkout-step-heading"
          className="space-y-6"
        >
          <h2
            id="checkout-step-heading"
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-xl font-bold text-mist-50 focus:outline-none"
          >
            {HEADINGS[step]}
          </h2>

          {step === 'shipping' && (
            <div className="space-y-6">
              <AddressPicker
                addresses={addresses}
                selectedId={selectedId}
                onSelect={setSelectedId}
                newAddress={newAddress}
                newAddressErrors={addressErrors}
                onNewAddressChange={setNewAddress}
              />
              <div className="flex justify-end">
                <Button size="lg" data-testid="shipping-continue" onClick={handleShippingContinue}>
                  Continue to payment →
                </Button>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div className="space-y-6">
              <PaymentForm value={payment} errors={paymentErrors} onChange={setPayment} />
              <div className="flex justify-between gap-3">
                <Button variant="secondary" data-testid="payment-back" onClick={() => setStep('shipping')}>
                  ← Back to shipping
                </Button>
                <Button size="lg" data-testid="payment-continue" onClick={handlePaymentContinue}>
                  Continue to review →
                </Button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              {cartLoading ? (
                <ListSkeleton rows={2} testId="review-skeleton" />
              ) : (
                <CheckoutReview
                  items={items}
                  address={shippingAddress}
                  last4={cardLast4(payment.cardNumber)}
                  cardHolder={payment.cardHolder}
                  totals={totals}
                  couponCode={cart?.couponCode}
                />
              )}
              <div className="flex justify-between gap-3">
                <Button variant="secondary" data-testid="review-back" onClick={() => setStep('payment')}>
                  ← Back to payment
                </Button>
                <Button size="lg" data-testid="place-order" disabled={placing} onClick={handlePlaceOrder}>
                  {placing ? 'Placing order…' : 'Place order'}
                </Button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
