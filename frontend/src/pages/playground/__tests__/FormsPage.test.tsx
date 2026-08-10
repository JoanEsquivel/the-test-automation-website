// ATDD: forms playground — every variant operable, outcome visible in the DOM,
// exactly one Recommended badge per widget row (4 widgets on this page).
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { useDifficultyStore } from '@/playground/difficulty'
import FormsPage from '../FormsPage'

beforeEach(() => {
  localStorage.clear()
  useDifficultyStore.setState({ level: 'easy' })
})

describe('FormsPage', () => {
  it('toggles the native checkbox and shows it in its readout', async () => {
    const user = userEvent.setup()
    render(<FormsPage />)
    const checkbox = screen.getByRole('checkbox', { name: /subscribe to the newsletter/i })
    expect(checkbox).not.toBeChecked()
    await user.click(checkbox)
    expect(checkbox).toBeChecked()
    expect(screen.getByTestId('forms-checkbox-native-readout')).toHaveTextContent(/subscribed/i)
  })

  it('toggles the fake div checkbox and updates its state readout', async () => {
    const user = userEvent.setup()
    render(<FormsPage />)
    const fake = screen.getByTestId('forms-checkbox-fake')
    expect(screen.getByTestId('forms-checkbox-fake-readout')).toHaveTextContent(/off/i)
    await user.click(fake)
    expect(screen.getByTestId('forms-checkbox-fake-readout')).toHaveTextContent(/on/i)
  })

  it('shows exactly one Recommended badge per widget (4 widgets)', () => {
    render(<FormsPage />)
    expect(screen.getAllByText('Recommended')).toHaveLength(4)
  })

  it('operates the role="switch" toggle', async () => {
    const user = userEvent.setup()
    render(<FormsPage />)
    const toggle = screen.getByRole('switch', { name: /email alerts/i })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })

  it('renders a form-summary with the current values on submit', async () => {
    const user = userEvent.setup()
    render(<FormsPage />)
    await user.type(screen.getByRole('textbox', { name: /^email$/i }), 'qa@example.com')
    await user.click(screen.getByRole('checkbox', { name: /subscribe to the newsletter/i }))
    await user.click(screen.getByRole('button', { name: /render summary/i }))
    const summary = screen.getByTestId('form-summary')
    expect(within(summary).getByText(/qa@example\.com/)).toBeInTheDocument()
    expect(within(summary).getByText(/newsletter/i).closest('div')).toHaveTextContent(/subscribed/i)
  })
})
