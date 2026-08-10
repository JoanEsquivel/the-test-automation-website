// ATDD: order history against the real engine via msw/node.
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { login, register } from '@/engine/auth'
import { addItem } from '@/engine/cart'
import { checkout } from '@/engine/orders'
import { useAuthStore } from '@/stores/auth'
import { resetClientState, server } from '@/test/shop'
import OrdersPage from '../OrdersPage'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
beforeEach(() => {
  resetClientState()
})

const ADDRESS = {
  label: 'Home',
  fullName: 'Casey Customer',
  street: '742 Evergreen Terrace',
  city: 'Springfield',
  zip: '49007',
  country: 'United States',
  isDefault: true,
}

function renderOrders() {
  return render(
    <MemoryRouter initialEntries={['/shop/orders']}>
      <OrdersPage />
    </MemoryRouter>,
  )
}

describe('OrdersPage', () => {
  it('lists a placed order with number, status and total', async () => {
    const { token, user } = login({ email: 'customer@example.com', password: 'Password123!' })
    addItem(token, null, { productId: 'prod-pulse-earbuds', qty: 1 })
    checkout(token, {
      shippingAddress: ADDRESS,
      payment: { cardNumber: '4111 1111 1111 1111', expiry: '12/30', cvc: '123', cardHolder: 'Casey' },
    })
    useAuthStore.setState({ token, user })

    renderOrders()
    const row = await screen.findByTestId('order-row-TAW-2026-0001', {}, { timeout: 4000 })
    expect(row).toHaveTextContent('TAW-2026-0001')
    expect(row).toHaveTextContent(/paid/i)
    expect(row).toHaveTextContent('$96.66')
  })

  it('shows the empty state for a user without orders', async () => {
    const { token, user } = register({ email: 'fresh@example.com', password: 'Secret123', name: 'Fresh' })
    useAuthStore.setState({ token, user })
    renderOrders()
    await screen.findByTestId('empty-orders', {}, { timeout: 4000 })
  })
})
