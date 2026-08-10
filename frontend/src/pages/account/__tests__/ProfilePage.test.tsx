// ATDD: profile + address book against the real engine via msw/node.
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { login } from '@/engine/auth'
import { useAuthStore } from '@/stores/auth'
import { resetClientState, server } from '@/test/shop'
import ProfilePage from '../ProfilePage'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
beforeEach(() => {
  resetClientState()
  const { token, user } = login({ email: 'customer@example.com', password: 'Password123!' })
  useAuthStore.setState({ token, user })
})

function renderProfile() {
  return render(
    <MemoryRouter initialEntries={['/account/profile']}>
      <ProfilePage />
    </MemoryRouter>,
  )
}

describe('ProfilePage', () => {
  it('renders the account details and every saved address', async () => {
    renderProfile()
    await screen.findByTestId('address-card-addr-home', {}, { timeout: 4000 })
    expect(screen.getByTestId('address-card-addr-office')).toBeInTheDocument()
    expect(screen.getByTestId('default-badge-addr-home')).toBeInTheDocument()
    expect(screen.queryByTestId('default-badge-addr-office')).not.toBeInTheDocument()
    expect(screen.getByTestId('profile-email')).toHaveTextContent('customer@example.com')
    expect(screen.getByTestId('profile-role')).toHaveTextContent(/customer/i)
    expect(screen.getByTestId('profile-orders-link')).toBeInTheDocument()
  })

  it('saves a new display name and refreshes the auth store', async () => {
    const user = userEvent.setup()
    renderProfile()
    const input = await screen.findByTestId('profile-name-input', {}, { timeout: 4000 })
    await user.clear(input)
    await user.type(input, 'Casey Renamed')
    await user.click(screen.getByTestId('save-profile'))
    await waitFor(() => expect(useAuthStore.getState().user?.name).toBe('Casey Renamed'), { timeout: 4000 })
  })

  it('appends a new address from the form', async () => {
    const user = userEvent.setup()
    renderProfile()
    await screen.findByTestId('address-card-addr-home', {}, { timeout: 4000 })
    await user.click(screen.getByTestId('add-address'))

    await user.type(screen.getByTestId('address-label'), 'Cabin')
    await user.type(screen.getByTestId('address-fullName'), 'Casey Customer')
    await user.type(screen.getByTestId('address-street'), '9 Pine Road')
    await user.type(screen.getByTestId('address-city'), 'Tahoe')
    await user.type(screen.getByTestId('address-zip'), '96150')
    await user.type(screen.getByTestId('address-country'), 'United States')
    await user.click(screen.getByTestId('save-address'))

    await waitFor(() => expect(screen.getByText('Cabin')).toBeInTheDocument(), { timeout: 4000 })
    await waitFor(() => expect(useAuthStore.getState().user?.addresses).toHaveLength(3), { timeout: 4000 })
  })

  it('moves the default flag when another address is promoted', async () => {
    const user = userEvent.setup()
    renderProfile()
    await screen.findByTestId('address-card-addr-office', {}, { timeout: 4000 })
    await user.click(screen.getByTestId('set-default-addr-office'))

    await screen.findByTestId('default-badge-addr-office', {}, { timeout: 4000 })
    await waitFor(() => expect(screen.queryByTestId('default-badge-addr-home')).not.toBeInTheDocument(), {
      timeout: 4000,
    })
  })

  it('deletes an address after the confirm dialog', async () => {
    const user = userEvent.setup()
    renderProfile()
    await screen.findByTestId('address-card-addr-office', {}, { timeout: 4000 })
    await user.click(screen.getByTestId('delete-address-addr-office'))
    await user.click(await screen.findByTestId('confirm-accept', {}, { timeout: 4000 }))

    await waitFor(() => expect(screen.queryByTestId('address-card-addr-office')).not.toBeInTheDocument(), {
      timeout: 4000,
    })
    expect(screen.getByTestId('address-card-addr-home')).toBeInTheDocument()
  })
})
