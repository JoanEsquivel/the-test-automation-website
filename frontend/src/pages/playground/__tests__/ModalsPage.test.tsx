// ATDD: modals playground. jsdom does not implement <dialog>.showModal, so the
// native variant is feature-detected in the component and only smoke-tested here;
// the portal variant is exercised thoroughly.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { useDifficultyStore } from '@/playground/difficulty'
import ModalsPage from '../ModalsPage'

beforeEach(() => {
  localStorage.clear()
  useDifficultyStore.setState({ level: 'easy' })
})

describe('ModalsPage', () => {
  it('opens the portal modal, confirms and reports the result', async () => {
    const user = userEvent.setup()
    render(<ModalsPage />)
    await user.click(screen.getByRole('button', { name: /open portal modal/i }))
    const dialog = screen.getByRole('dialog', { name: /portal feedback/i })
    expect(dialog).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: /your feedback/i }), 'Great site')
    await user.click(screen.getByRole('button', { name: /^confirm$/i }))
    expect(screen.queryByRole('dialog', { name: /portal feedback/i })).not.toBeInTheDocument()
    expect(screen.getByTestId('modals-portal-readout')).toHaveTextContent(/confirmed: great site/i)
  })

  it('closes the portal modal with Escape and reports dismissal', async () => {
    const user = userEvent.setup()
    render(<ModalsPage />)
    await user.click(screen.getByRole('button', { name: /open portal modal/i }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: /portal feedback/i })).not.toBeInTheDocument()
    expect(screen.getByTestId('modals-portal-readout')).toHaveTextContent(/dismissed/i)
  })

  it('traps focus inside the portal modal', async () => {
    const user = userEvent.setup()
    render(<ModalsPage />)
    await user.click(screen.getByRole('button', { name: /open portal modal/i }))
    // Tab repeatedly: focus must stay within the dialog
    await user.tab()
    await user.tab()
    await user.tab()
    const dialog = screen.getByRole('dialog', { name: /portal feedback/i })
    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  it('renders the native dialog variant and opens it via the fallback', async () => {
    const user = userEvent.setup()
    render(<ModalsPage />)
    await user.click(screen.getByRole('button', { name: /open native dialog/i }))
    expect(screen.getByRole('dialog', { name: /native feedback/i })).toBeInTheDocument()
  })

  it('toggles the legacy inline modal', async () => {
    const user = userEvent.setup()
    render(<ModalsPage />)
    await user.click(screen.getByRole('button', { name: /open legacy modal/i }))
    expect(screen.getByTestId('modals-legacy-readout')).toHaveTextContent(/open/i)
  })

  it('has one Recommended badge per widget row (modal + tooltip)', () => {
    render(<ModalsPage />)
    expect(screen.getAllByText('Recommended')).toHaveLength(2)
  })
})
