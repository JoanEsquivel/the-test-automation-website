// ATDD: admin dashboard tiles + accessible chart data tables against the real engine.
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { AddressInput, PaymentInput } from '@/api/types'
import { login } from '@/engine/auth'
import { addItem } from '@/engine/cart'
import { checkout } from '@/engine/orders'
import { useAuthStore } from '@/stores/auth'
import { resetClientState, server } from '@/test/shop'
import AdminDashboardPage from '../AdminDashboardPage'

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

function signInAsAdmin() {
  const { token, user } = login({ email: 'admin@example.com', password: 'Admin123!' })
  useAuthStore.setState({ token, user })
}

function placeOrder() {
  const { token } = login({ email: 'customer@example.com', password: 'Password123!' })
  addItem(token, null, { productId: 'prod-pulse-earbuds', qty: 1 })
  checkout(token, { shippingAddress: ADDRESS, payment: GOOD_CARD })
}

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <AdminDashboardPage />
    </MemoryRouter>,
  )
}

describe('AdminDashboardPage', () => {
  it('renders the four stat tiles from /api/admin/stats', async () => {
    placeOrder()
    signInAsAdmin()
    renderDashboard()

    const revenue = await screen.findByTestId('stat-total-revenue', {}, { timeout: 4000 })
    expect(revenue).toHaveTextContent('$96.66')
    expect(screen.getByTestId('stat-order-count')).toHaveTextContent('1')
    expect(screen.getByTestId('stat-avg-order-value')).toHaveTextContent('$96.66')
    // prod-studio-mic is seeded with stock 0 -> exactly one low-stock product
    expect(screen.getByTestId('stat-low-stock')).toHaveTextContent('1')
  })

  it('describes both charts with a readable data table', async () => {
    placeOrder()
    signInAsAdmin()
    renderDashboard()

    const categoryTable = await screen.findByTestId('revenue-by-category-table', {}, { timeout: 4000 })
    expect(categoryTable).toBeInTheDocument()
    expect(screen.getByTestId('revenue-row-audio')).toHaveTextContent('$89.50')
    expect(screen.getByTestId('orders-by-status-table')).toBeInTheDocument()
    expect(screen.getByTestId('status-row-paid')).toHaveTextContent('1')
    expect(screen.getByTestId('revenue-by-category-chart')).toHaveAccessibleName(/revenue/i)
    expect(screen.getByTestId('orders-by-status-chart')).toHaveAccessibleName(/status/i)
  })

  it('shows the empty state before any order exists', async () => {
    signInAsAdmin()
    renderDashboard()
    const empty = await screen.findByTestId('dashboard-empty', {}, { timeout: 4000 })
    expect(empty).toHaveTextContent(/store/i)
  })
})
