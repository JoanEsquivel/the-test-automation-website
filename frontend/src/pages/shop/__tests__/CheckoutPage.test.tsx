// ATDD: 3-step checkout wizard against the real engine via msw/node.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { login } from '@/engine/auth'
import { addItem } from '@/engine/cart'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { resetClientState, server } from '@/test/shop'
import CheckoutPage from '../CheckoutPage'
import ConfirmationPage from '../ConfirmationPage'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
beforeEach(() => {
  resetClientState()
  const { token, user } = login({ email: 'customer@example.com', password: 'Password123!' })
  useAuthStore.setState({ token, user })
  addItem(token, null, { productId: 'prod-pulse-earbuds', qty: 1 })
  useCartStore.setState({ cartId: null, itemCount: 1 })
})

function renderCheckout() {
  return render(
    <MemoryRouter initialEntries={['/shop/checkout']}>
      <Routes>
        <Route path="/shop/checkout" element={<CheckoutPage />} />
        <Route path="/shop/orders/:orderId/confirmation" element={<ConfirmationPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillPayment(user: ReturnType<typeof userEvent.setup>, cardNumber: string, masked: string) {
  await user.type(screen.getByTestId('card-number'), cardNumber)
  // input masks as you type: #### #### #### ####
  expect(screen.getByTestId('card-number')).toHaveValue(masked)
  await user.type(screen.getByTestId('card-expiry'), '1230')
  // expiry auto-slashes to MM/YY
  expect(screen.getByTestId('card-expiry')).toHaveValue('12/30')
  await user.type(screen.getByTestId('card-cvc'), '123')
  await user.type(screen.getByTestId('card-holder'), 'Casey Customer')
  await user.click(screen.getByTestId('payment-continue'))
}

describe('CheckoutPage', () => {
  it('completes the wizard with the success card and lands on the confirmation', async () => {
    const user = userEvent.setup()
    renderCheckout()

    // Shipping: saved addresses are offered, default preselected.
    const step = await screen.findByTestId('checkout-step', {}, { timeout: 4000 })
    expect(step).toHaveAttribute('data-step', 'shipping')
    await screen.findByTestId('address-option-addr-home', {}, { timeout: 4000 })
    await user.click(screen.getByTestId('shipping-continue'))

    // Payment: masked card entry.
    expect(screen.getByTestId('checkout-step')).toHaveAttribute('data-step', 'payment')
    await fillPayment(user, '4111111111111111', '4111 1111 1111 1111')

    // Review: read-only summary, then place the order.
    expect(screen.getByTestId('checkout-step')).toHaveAttribute('data-step', 'review')
    expect(screen.getByTestId('review-last4')).toHaveTextContent('1111')
    await user.click(screen.getByTestId('place-order'))

    const orderNumber = await screen.findByTestId('order-number', {}, { timeout: 5000 })
    expect(orderNumber).toHaveTextContent('TAW-2026-0001')
  }, 20000)

  it('returns to the payment step with a banner when the card is declined', async () => {
    const user = userEvent.setup()
    renderCheckout()

    await screen.findByTestId('address-option-addr-home', {}, { timeout: 4000 })
    await user.click(screen.getByTestId('shipping-continue'))
    await fillPayment(user, '4000000000000000', '4000 0000 0000 0000')
    await user.click(screen.getByTestId('place-order'))

    const banner = await screen.findByTestId('checkout-error', {}, { timeout: 5000 })
    expect(banner).toHaveTextContent(/declined/i)
    expect(screen.getByTestId('checkout-step')).toHaveAttribute('data-step', 'payment')
  }, 20000)
})
