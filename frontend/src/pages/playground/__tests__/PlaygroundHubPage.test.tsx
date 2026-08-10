// ATDD: hub page lists all categories from the registry — live ones as links,
// next-phase ones as non-link cards with a "Next phase" badge.
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import PlaygroundHubPage from '../PlaygroundHubPage'

function renderHub() {
  return render(
    <MemoryRouter>
      <PlaygroundHubPage />
    </MemoryRouter>,
  )
}

describe('PlaygroundHubPage', () => {
  it('renders link cards for the six live categories', () => {
    renderHub()
    for (const slug of ['forms', 'dropdowns', 'pickers', 'tables', 'modals', 'navigation']) {
      const card = screen.getByTestId(`category-${slug}`)
      expect(card.tagName).toBe('A')
      expect(card).toHaveAttribute('href', `/playground/${slug}`)
    }
  })

  it('renders coming-soon categories as non-link cards with a Next phase badge', () => {
    renderHub()
    for (const slug of ['dynamic', 'frames', 'shadow', 'windows', 'files', 'interactions']) {
      const card = screen.getByTestId(`category-${slug}`)
      expect(card.tagName).not.toBe('A')
      expect(card).toHaveTextContent(/next phase/i)
    }
  })

  it('no longer shows the old coming-soon placeholder', () => {
    renderHub()
    expect(screen.queryByTestId('coming-soon')).not.toBeInTheDocument()
  })
})
