// ATDD: login page against the real engine via msw/node.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { useAuthStore } from '@/stores/auth'
import { resetClientState, server } from '@/test/shop'
import LoginPage from '../LoginPage'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
beforeEach(() => {
  resetClientState()
})

function renderLogin(initialEntry = '/account/login') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/account/login" element={<LoginPage />} />
        <Route path="/shop/checkout" element={<p>CHECKOUT PROBE</p>} />
        <Route path="/" element={<p>HOME PROBE</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  it('shows the API error banner for bad credentials', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByTestId('login-email'), 'customer@example.com')
    await user.type(screen.getByTestId('login-password'), 'wrong-password')
    await user.click(screen.getByTestId('login-submit'))
    const banner = await screen.findByTestId('login-error', {}, { timeout: 4000 })
    expect(banner).toHaveTextContent('Email or password is incorrect.')
    expect(useAuthStore.getState().token).toBeNull()
  })

  it('logs in with seed credentials and honors ?returnTo', async () => {
    const user = userEvent.setup()
    renderLogin('/account/login?returnTo=%2Fshop%2Fcheckout')
    // the helper card can fill the customer credentials
    await user.click(screen.getByTestId('fill-customer'))
    await user.click(screen.getByTestId('login-submit'))
    await screen.findByText('CHECKOUT PROBE', {}, { timeout: 4000 })
    expect(useAuthStore.getState().token).toBeTruthy()
    expect(useAuthStore.getState().user?.email).toBe('customer@example.com')
  })

  it('redirects to home when no returnTo is given', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByTestId('fill-customer'))
    await user.click(screen.getByTestId('login-submit'))
    await screen.findByText('HOME PROBE', {}, { timeout: 4000 })
  })

  it('validates required fields inline before hitting the API', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByTestId('login-submit'))
    expect(screen.getByTestId('login-email-error')).toBeInTheDocument()
    expect(screen.getByTestId('login-password-error')).toBeInTheDocument()
  })
})
