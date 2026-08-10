// ATDD: pickers playground — native date input, custom calendar grid, legacy D/M/Y selects.
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { useDifficultyStore } from '@/playground/difficulty'
import PickersPage from '../PickersPage'

beforeEach(() => {
  localStorage.clear()
  useDifficultyStore.setState({ level: 'easy' })
})

describe('PickersPage', () => {
  it('native date input updates its readout', () => {
    render(<PickersPage />)
    const input = screen.getByLabelText(/pick a date/i)
    fireEvent.change(input, { target: { value: '2026-08-09' } })
    expect(screen.getByTestId('pickers-native-readout')).toHaveTextContent('2026-08-09')
  })

  it('custom calendar grid selects a day', async () => {
    const user = userEvent.setup()
    render(<PickersPage />)
    await user.click(screen.getByRole('button', { name: /open calendar/i }))
    const grid = screen.getByRole('grid')
    await user.click(within(grid).getByRole('button', { name: /15/ }))
    expect(screen.getByTestId('pickers-calendar-readout')).toHaveTextContent(/-15$/)
  })

  it('legacy D/M/Y selects compose a date', async () => {
    const user = userEvent.setup()
    render(<PickersPage />)
    await user.selectOptions(screen.getByLabelText(/^day$/i), '9')
    await user.selectOptions(screen.getByLabelText(/^month$/i), 'August')
    await user.selectOptions(screen.getByLabelText(/^year$/i), '2026')
    expect(screen.getByTestId('pickers-legacy-readout')).toHaveTextContent('2026-08-09')
  })

  it('has exactly one Recommended badge per widget row (date + native extras)', () => {
    render(<PickersPage />)
    expect(screen.getAllByText('Recommended')).toHaveLength(2)
  })
})
