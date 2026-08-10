// ATDD: cart page totals + coupon flows against the real engine via msw/node.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { addItem, createCart } from '@/engine/cart'
import { useCartStore } from '@/stores/cart'
import { resetClientState, server } from '@/test/shop'
import CartPage from '../CartPage'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
beforeEach(() => {
  resetClientState()
})

function seedGuestCartWithEarbuds(): string {
  const { cartId } = createCart(null)
  addItem(null, cartId, { productId: 'prod-pulse-earbuds', qty: 1 })
  useCartStore.setState({ cartId, itemCount: 1 })
  return cartId
}

function renderCart() {
  return render(
    <MemoryRouter initialEntries={['/shop/cart']}>
      <CartPage />
    </MemoryRouter>,
  )
}

describe('CartPage', () => {
  it('shows the normative totals for the 89.50 free-shipping case', async () => {
    seedGuestCartWithEarbuds()
    renderCart()
    await screen.findByTestId('cart-item-prod-pulse-earbuds', {}, { timeout: 4000 })
    expect(screen.getByTestId('totals-subtotal')).toHaveTextContent('$89.50')
    expect(screen.getByTestId('totals-shipping')).toHaveTextContent(/free/i)
    expect(screen.getByTestId('totals-tax')).toHaveTextContent('$7.16')
    expect(screen.getByTestId('totals-total')).toHaveTextContent('$96.66')
  })

  it('applies WELCOME10 and shows the discount row', async () => {
    seedGuestCartWithEarbuds()
    const user = userEvent.setup()
    renderCart()
    await screen.findByTestId('cart-item-prod-pulse-earbuds', {}, { timeout: 4000 })
    await user.type(screen.getByTestId('coupon-input'), 'WELCOME10')
    await user.click(screen.getByTestId('apply-coupon'))
    const discount = await screen.findByTestId('totals-discount', {}, { timeout: 4000 })
    expect(discount).toHaveTextContent('$8.95')
    expect(screen.getByTestId('totals-total')).toHaveTextContent('$86.99')
  })

  it('shows the exact API error for SAVE20 under the minimum subtotal', async () => {
    seedGuestCartWithEarbuds()
    const user = userEvent.setup()
    renderCart()
    await screen.findByTestId('cart-item-prod-pulse-earbuds', {}, { timeout: 4000 })
    await user.type(screen.getByTestId('coupon-input'), 'SAVE20')
    await user.click(screen.getByTestId('apply-coupon'))
    const banner = await screen.findByTestId('coupon-banner', {}, { timeout: 4000 })
    expect(banner).toHaveTextContent("Coupon 'SAVE20' requires a subtotal of at least $100.00.")
  })

  it('shows the empty state with a catalog link when there is no cart', async () => {
    renderCart()
    const empty = await screen.findByTestId('empty-cart', {}, { timeout: 4000 })
    expect(empty).toBeInTheDocument()
  })
})
