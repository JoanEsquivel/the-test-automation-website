// ATDD: dropdowns playground — native select, keyboard-operable ARIA listbox,
// async-filtered combobox (must be awaited with findBy*).
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { useDifficultyStore } from '@/playground/difficulty'
import DropdownsPage from '../DropdownsPage'

beforeEach(() => {
  localStorage.clear()
  useDifficultyStore.setState({ level: 'easy' })
})

describe('DropdownsPage', () => {
  it('native select updates its readout', async () => {
    const user = userEvent.setup()
    render(<DropdownsPage />)
    const select = screen.getByRole('combobox', { name: /favorite fruit/i })
    await user.selectOptions(select, 'Mango')
    expect(screen.getByTestId('dropdowns-native-readout')).toHaveTextContent('Mango')
  })

  it('ARIA listbox opens and selects with the keyboard', async () => {
    const user = userEvent.setup()
    render(<DropdownsPage />)
    const trigger = screen.getByRole('button', { name: /choose a tool/i })
    await user.click(trigger)
    const listbox = screen.getByRole('listbox', { name: /automation tools/i })
    expect(listbox).toBeInTheDocument()
    await user.keyboard('{ArrowDown}{Enter}')
    expect(screen.getByTestId('dropdowns-listbox-readout')).toHaveTextContent('Selenium')
    expect(screen.queryByRole('listbox', { name: /automation tools/i })).not.toBeInTheDocument()
  })

  it('closes the ARIA listbox with Escape', async () => {
    const user = userEvent.setup()
    render(<DropdownsPage />)
    await user.click(screen.getByRole('button', { name: /choose a tool/i }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox', { name: /automation tools/i })).not.toBeInTheDocument()
  })

  it('combobox filters options asynchronously', async () => {
    const user = userEvent.setup()
    render(<DropdownsPage />)
    const input = screen.getByRole('combobox', { name: /search country/i })
    await user.type(input, 'mal')
    // options appear only after the simulated 300 ms search delay
    const suggestions = await screen.findByRole('listbox', { name: /country suggestions/i })
    expect(within(suggestions).getByRole('option', { name: 'Malta' })).toBeInTheDocument()
    expect(within(suggestions).queryByRole('option', { name: 'Mexico' })).not.toBeInTheDocument()
    await user.click(within(suggestions).getByRole('option', { name: 'Malta' }))
    expect(screen.getByTestId('dropdowns-combobox-readout')).toHaveTextContent('Malta')
  })
})
