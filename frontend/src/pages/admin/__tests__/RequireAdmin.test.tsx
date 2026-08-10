// ATDD: the /admin guard — anonymous redirect, customer 403, admin passthrough.
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import RequireAdmin from '@/components/RequireAdmin'
import { login } from '@/engine/auth'
import { useAuthStore } from '@/stores/auth'
import { resetClientState, server } from '@/test/shop'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
beforeEach(() => {
  resetClientState()
})

function signIn(email: string, password: string) {
  const { token, user } = login({ email, password })
  useAuthStore.setState({ token, user })
}

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<p>ADMIN PROBE</p>} />
        </Route>
        <Route path="/account/login" element={<p>LOGIN PROBE</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireAdmin', () => {
  it('sends anonymous visitors to the login page with a returnTo', () => {
    renderGuard()
    expect(screen.getByText('LOGIN PROBE')).toBeInTheDocument()
  })

  it('shows the styled 403 page to a signed-in customer', () => {
    signIn('customer@example.com', 'Password123!')
    renderGuard()
    const forbidden = screen.getByTestId('forbidden')
    expect(forbidden).toHaveTextContent(/admin/i)
    expect(forbidden).toHaveTextContent('admin@example.com')
    expect(screen.queryByText('ADMIN PROBE')).not.toBeInTheDocument()
  })

  it('lets an admin through to the outlet', () => {
    signIn('admin@example.com', 'Admin123!')
    renderGuard()
    expect(screen.getByText('ADMIN PROBE')).toBeInTheDocument()
  })
})
