// ATDD: the difficulty selector must always stay easy-locatable itself,
// offer the three levels and persist the choice under taw:difficulty.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { DifficultySelector } from '@/playground/DifficultySelector'
import { useDifficultyStore } from '@/playground/difficulty'

beforeEach(() => {
  localStorage.clear()
  useDifficultyStore.setState({ level: 'easy' })
})

describe('DifficultySelector', () => {
  it('renders the three difficulty options', () => {
    render(<DifficultySelector />)
    expect(screen.getByRole('button', { name: /easy/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /medium/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /evil/i })).toBeInTheDocument()
  })

  it('marks the current level as pressed', async () => {
    const user = userEvent.setup()
    render(<DifficultySelector />)
    expect(screen.getByRole('button', { name: /easy/i })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: /medium/i }))
    expect(screen.getByRole('button', { name: /medium/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /easy/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('persists the chosen level to localStorage under taw:difficulty', async () => {
    const user = userEvent.setup()
    render(<DifficultySelector />)
    await user.click(screen.getByRole('button', { name: /evil/i }))
    expect(localStorage.getItem('taw:difficulty')).toContain('evil')
  })

  it('keeps data-testid="difficulty-selector" at every level', async () => {
    const user = userEvent.setup()
    render(<DifficultySelector />)
    expect(screen.getByTestId('difficulty-selector')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /medium/i }))
    expect(screen.getByTestId('difficulty-selector')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /evil/i }))
    expect(screen.getByTestId('difficulty-selector')).toBeInTheDocument()
  })
})
