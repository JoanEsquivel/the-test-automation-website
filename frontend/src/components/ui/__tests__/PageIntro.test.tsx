// ATDD: written before PageIntro exists. Every page must be self-describing —
// PageIntro is the component that enforces that rule.
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PageIntro } from '../PageIntro'

describe('PageIntro', () => {
  it('renders the title as the page heading', () => {
    render(<PageIntro title="Checkboxes" what="Practice checkbox automation." how="Toggle the boxes below." />)
    expect(screen.getByRole('heading', { level: 1, name: 'Checkboxes' })).toBeInTheDocument()
  })

  it('explains what the page does and how to use it', () => {
    render(<PageIntro title="T" what="WHAT-TEXT" how="HOW-TEXT" />)
    expect(screen.getByText('WHAT-TEXT')).toBeInTheDocument()
    expect(screen.getByText('HOW-TEXT')).toBeInTheDocument()
    expect(screen.getByText(/what this page does/i)).toBeInTheDocument()
    expect(screen.getByText(/how to use it/i)).toBeInTheDocument()
  })

  it('is locatable via a stable test id', () => {
    render(<PageIntro title="T" what="w" how="h" />)
    expect(screen.getByTestId('page-intro')).toBeInTheDocument()
  })
})
