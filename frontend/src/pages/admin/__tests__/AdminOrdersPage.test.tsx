// ATDD: admin order table — listing, status filter and the transition graph.
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { AddressInput, Order, PaymentInput } from '@/api/types'
import { login } from '@/engine/auth'
import { addItem } from '@/engine/cart'
import { checkout } from '@/engine/orders'
import { useAuthStore } from '@/stores/auth'
import { resetClientState, server } from '@/test/shop'
import AdminOrdersPage from '../AdminOrdersPage'

const ADDRESS: AddressInput = {
  label: 'Home',
  fullName: 'Casey Customer',
  street: '742 Evergreen Terrace',
  city: 'Springfield',
  zip: '49007',
  country: 'United States',
  isDefault: true,
}

const GOOD_CARD: PaymentInput = {
  cardNumber: '4111 1111 1111 1111',
  expiry: '12/30',
  cvc: '123',
  cardHolder: 'Casey Customer',
}

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
beforeEach(() => {
  resetClientState()
})

function placeOrder(): Order {
  const { token } = login({ email: 'customer@example.com', password: 'Password123!' })
  addItem(token, null, { productId: 'prod-pulse-earbuds', qty: 1 })
  return checkout(token, { shippingAddress: ADDRESS, payment: GOOD_CARD })
}

function signInAsAdmin() {
  const { token, user } = login({ email: 'admin@example.com', password: 'Admin123!' })
  useAuthStore.setState({ token, user })
}

function renderOrders() {
  return render(
    <MemoryRouter initialEntries={['/admin/orders']}>
      <AdminOrdersPage />
    </MemoryRouter>,
  )
}

describe('AdminOrdersPage', () => {
  it('lists a placed order with its number, customer and total', async () => {
    const order = placeOrder()
    signInAsAdmin()
    renderOrders()

    const row = await screen.findByTestId(`admin-order-row-${order.id}`, {}, { timeout: 4000 })
    expect(row).toHaveTextContent('TAW-2026-0001')
    expect(row).toHaveTextContent('user-customer')
    expect(row).toHaveTextContent('$96.66')
    expect(within(row).getByTestId('order-status-TAW-2026-0001')).toHaveTextContent('Paid')
  })

  it('offers only the legal next states for the current status', async () => {
    const order = placeOrder()
    signInAsAdmin()
    renderOrders()

    const select = await screen.findByTestId(`advance-status-${order.id}`, {}, { timeout: 4000 })
    const options = within(select as HTMLSelectElement)
      .getAllByRole('option')
      .map((option) => (option as HTMLOptionElement).value)
      .filter(Boolean)
    expect(options).toEqual(['shipped', 'cancelled'])
  })

  it('advances paid -> shipped and updates the status chip', async () => {
    const order = placeOrder()
    signInAsAdmin()
    const user = userEvent.setup()
    renderOrders()

    await screen.findByTestId(`advance-status-${order.id}`, {}, { timeout: 4000 })
    await user.selectOptions(screen.getByTestId(`advance-status-${order.id}`), 'shipped')
    await user.click(screen.getByTestId(`apply-status-${order.id}`))

    await waitFor(
      () => expect(screen.getByTestId('order-status-TAW-2026-0001')).toHaveTextContent('Shipped'),
      { timeout: 4000 },
    )
  })

  it('filters the table by status', async () => {
    const order = placeOrder()
    signInAsAdmin()
    const user = userEvent.setup()
    renderOrders()

    await screen.findByTestId(`admin-order-row-${order.id}`, {}, { timeout: 4000 })
    await user.selectOptions(screen.getByTestId('order-status-filter'), 'shipped')
    await waitFor(() => expect(screen.getByTestId('admin-orders-empty')).toBeInTheDocument(), {
      timeout: 4000,
    })

    await user.selectOptions(screen.getByTestId('order-status-filter'), 'paid')
    await screen.findByTestId(`admin-order-row-${order.id}`, {}, { timeout: 4000 })
  })
})
