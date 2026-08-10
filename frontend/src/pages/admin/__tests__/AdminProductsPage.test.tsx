// ATDD: admin product table — listing, search, create and delete.
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { login } from '@/engine/auth'
import { useAuthStore } from '@/stores/auth'
import { resetClientState, server } from '@/test/shop'
import AdminProductsPage from '../AdminProductsPage'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
beforeEach(() => {
  resetClientState()
  const { token, user } = login({ email: 'admin@example.com', password: 'Admin123!' })
  useAuthStore.setState({ token, user })
})

function renderProducts() {
  return render(
    <MemoryRouter initialEntries={['/admin/products']}>
      <AdminProductsPage />
    </MemoryRouter>,
  )
}

describe('AdminProductsPage', () => {
  it('lists the seeded products with a count and pagination', async () => {
    renderProducts()
    await screen.findByTestId('admin-product-row-prod-aurora-headphones', {}, { timeout: 4000 })
    expect(screen.getByTestId('admin-products-count')).toHaveTextContent('24')
    expect(screen.getByTestId('admin-products-pagination')).toBeInTheDocument()
  })

  it('filters the table with the search box', async () => {
    const user = userEvent.setup()
    renderProducts()
    await screen.findByTestId('admin-product-row-prod-aurora-headphones', {}, { timeout: 4000 })
    await user.type(screen.getByTestId('admin-product-search'), 'aurora')
    await waitFor(() => expect(screen.getByTestId('admin-products-count')).toHaveTextContent('1'), {
      timeout: 4000,
    })
    expect(screen.queryByTestId('admin-product-row-prod-pulse-earbuds')).not.toBeInTheDocument()
  })

  it('creates a product from the modal form and shows it in the table', async () => {
    const user = userEvent.setup()
    renderProducts()
    await screen.findByTestId('admin-product-row-prod-aurora-headphones', {}, { timeout: 4000 })

    await user.click(screen.getByTestId('create-product'))
    await user.type(screen.getByTestId('product-form-name'), 'Test Gadget')
    await user.type(screen.getByTestId('product-form-description'), 'Created by the admin test suite.')
    await user.clear(screen.getByTestId('product-form-price'))
    await user.type(screen.getByTestId('product-form-price'), '42')
    await user.selectOptions(screen.getByTestId('product-form-category'), 'accessories')
    await user.clear(screen.getByTestId('product-form-stock'))
    await user.type(screen.getByTestId('product-form-stock'), '10')
    await user.click(screen.getByTestId('product-form-submit'))

    await waitFor(() => expect(screen.getByTestId('admin-products-count')).toHaveTextContent('25'), {
      timeout: 4000,
    })
    expect(await screen.findByText('Test Gadget', {}, { timeout: 4000 })).toBeInTheDocument()
  })

  it('deletes a product after the confirm dialog', async () => {
    const user = userEvent.setup()
    renderProducts()
    await screen.findByTestId('admin-product-row-prod-aurora-headphones', {}, { timeout: 4000 })

    await user.click(screen.getByTestId('delete-product-prod-aurora-headphones'))
    await user.click(await screen.findByTestId('confirm-accept', {}, { timeout: 4000 }))

    await waitFor(
      () => expect(screen.queryByTestId('admin-product-row-prod-aurora-headphones')).not.toBeInTheDocument(),
      { timeout: 4000 },
    )
    expect(screen.getByTestId('admin-products-count')).toHaveTextContent('23')
  })

  it('prefills the modal when editing an existing product', async () => {
    const user = userEvent.setup()
    renderProducts()
    await screen.findByTestId('admin-product-row-prod-aurora-headphones', {}, { timeout: 4000 })
    await user.click(screen.getByTestId('edit-product-prod-aurora-headphones'))
    expect(screen.getByTestId('product-form-name')).toHaveValue('Aurora Wireless Headphones')
    expect(screen.getByTestId('product-form-price')).toHaveValue(199.99)
  })
})
