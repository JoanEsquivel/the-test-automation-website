// ATDD: catalog against the real engine via msw/node.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { resetClientState, server } from '@/test/shop'
import CatalogPage from '../CatalogPage'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
beforeEach(() => {
  resetClientState()
})

function LocationSpy() {
  const location = useLocation()
  return <output data-testid="location-spy">{location.pathname + location.search}</output>
}

function renderCatalog(initialEntry = '/shop/catalog') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/shop/catalog" element={<CatalogPage />} />
      </Routes>
      <LocationSpy />
    </MemoryRouter>,
  )
}

describe('CatalogPage', () => {
  it('renders the first page of 12 products from the engine', async () => {
    renderCatalog()
    const cards = await screen.findAllByTestId(/^product-card-/, {}, { timeout: 4000 })
    expect(cards).toHaveLength(12)
  })

  it('narrows results with the debounced search and reflects it in the URL', async () => {
    const user = userEvent.setup()
    renderCatalog()
    await screen.findAllByTestId(/^product-card-/, {}, { timeout: 4000 })
    await user.type(screen.getByTestId('catalog-search'), 'cable clip')
    await screen.findByTestId('product-card-prod-cable-clip', {}, { timeout: 4000 })
    expect(screen.getAllByTestId(/^product-card-/)).toHaveLength(1)
    expect(screen.getByTestId('location-spy')).toHaveTextContent('search=cable')
  })

  it('shows the empty state when nothing matches', async () => {
    const user = userEvent.setup()
    renderCatalog()
    await user.type(screen.getByTestId('catalog-search'), 'zzz-no-such-product')
    await screen.findByTestId('empty-results', {}, { timeout: 4000 })
  })

  it('disables add-to-cart for out-of-stock products', async () => {
    renderCatalog('/shop/catalog?search=studio')
    const card = await screen.findByTestId('product-card-prod-studio-mic', {}, { timeout: 4000 })
    expect(card).toHaveTextContent(/out of stock/i)
    expect(screen.getByTestId('add-to-cart-prod-studio-mic')).toBeDisabled()
  })

  it('updates the URL when a category chip and sort option are chosen', async () => {
    const user = userEvent.setup()
    renderCatalog()
    await screen.findAllByTestId(/^product-card-/, {}, { timeout: 4000 })
    await user.click(await screen.findByTestId('category-chip-audio', {}, { timeout: 4000 }))
    await screen.findByTestId('product-card-prod-pulse-earbuds', {}, { timeout: 4000 })
    expect(screen.getByTestId('location-spy')).toHaveTextContent('category=audio')
    await user.selectOptions(screen.getByTestId('catalog-sort'), 'price-asc')
    expect(screen.getByTestId('location-spy')).toHaveTextContent('sort=price-asc')
  })
})
