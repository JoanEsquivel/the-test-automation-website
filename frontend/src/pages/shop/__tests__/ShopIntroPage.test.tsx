// ATDD: the /shop pre-screen is REQUIRED content per docs/02-specs/ecommerce-spec.md.
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { resetClientState } from '@/test/shop'
import ShopIntroPage from '../ShopIntroPage'

beforeEach(() => {
  resetClientState()
})

function renderPage() {
  return render(
    <MemoryRouter>
      <ShopIntroPage />
    </MemoryRouter>,
  )
}

describe('ShopIntroPage', () => {
  it('lists all 12 implemented features as a checklist grid', () => {
    renderPage()
    const checklist = screen.getByTestId('feature-checklist')
    expect(within(checklist).getAllByRole('listitem')).toHaveLength(12)
    expect(checklist).toHaveTextContent(/3-step checkout/i)
    expect(checklist).toHaveTextContent(/admin dashboard/i)
  })

  it('shows the prominent mode warning panel with the current mode pill', () => {
    renderPage()
    const warning = screen.getByTestId('mode-warning')
    expect(warning).toHaveTextContent(/browser mode/i)
    expect(warning).toHaveTextContent(/backend mode/i)
    expect(within(warning).getByTestId('mode-warning-pill')).toHaveTextContent(/browser/i)
  })

  it('shows test credentials, payment cards and all four coupons', () => {
    renderPage()
    const card = screen.getByTestId('test-credentials')
    expect(card).toHaveTextContent('customer@example.com')
    expect(card).toHaveTextContent('admin@example.com')
    expect(card).toHaveTextContent('4111 1111 1111 1111')
    for (const coupon of ['WELCOME10', 'SAVE20', 'EXPIRED50', 'DISABLED5']) {
      expect(card).toHaveTextContent(coupon)
    }
  })

  it('offers Reset demo data (browser mode) and the Enter the store CTA', () => {
    renderPage()
    expect(screen.getByTestId('reset-demo-data')).toBeInTheDocument()
    expect(screen.getByTestId('enter-store')).toHaveAttribute('href', '/shop/catalog')
  })
})
