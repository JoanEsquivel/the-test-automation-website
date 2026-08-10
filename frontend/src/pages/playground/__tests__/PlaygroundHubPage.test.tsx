// ATDD: hub page lists all categories from the registry as live link cards,
// with an expandable automation cheat-sheet on the challenge categories.
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { PLAYGROUND_CATEGORIES } from '@/playground/registry'
import PlaygroundHubPage from '../PlaygroundHubPage'

function renderHub() {
  return render(
    <MemoryRouter>
      <PlaygroundHubPage />
    </MemoryRouter>,
  )
}

describe('PlaygroundHubPage', () => {
  it('renders a link card for every category — nothing is coming soon anymore', () => {
    renderHub()
    for (const category of PLAYGROUND_CATEGORIES) {
      const card = screen.getByTestId(`category-${category.slug}`)
      const link = within(card).getByRole('link')
      expect(link).toHaveAttribute('href', category.path)
    }
    expect(screen.queryByText(/next phase/i)).not.toBeInTheDocument()
  })

  it('shows an automation cheat-sheet on the challenge categories', () => {
    renderHub()
    for (const slug of ['dynamic', 'frames', 'shadow', 'windows', 'files', 'interactions']) {
      const card = screen.getByTestId(`category-${slug}`)
      expect(within(card).getByText(/automation cheat-sheet/i)).toBeInTheDocument()
    }
  })

  it('cheat-sheet lists tool + API pairs (frames example)', () => {
    renderHub()
    const card = screen.getByTestId('category-frames')
    expect(within(card).getByText(/frameLocator/)).toBeInTheDocument()
    expect(within(card).getByText(/switchTo\(\)\.frame/)).toBeInTheDocument()
  })
})
