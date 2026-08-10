// ATDD: written before HomePage exists. The home screen must present exactly
// two paths: the Components Playground and the Ecommerce demo.
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import HomePage from '../HomePage'

function renderHome() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  it('offers the two practice paths as links', () => {
    renderHome()
    const playground = screen.getByRole('link', { name: /components playground/i })
    const store = screen.getByRole('link', { name: /taw store/i })
    expect(playground).toHaveAttribute('href', '/playground')
    expect(store).toHaveAttribute('href', '/shop')
  })

  it('has stable test ids for both path cards', () => {
    renderHome()
    expect(screen.getByTestId('path-playground')).toBeInTheDocument()
    expect(screen.getByTestId('path-store')).toBeInTheDocument()
  })

  it('explains the purpose of the site', () => {
    renderHome()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/test automation/i)
  })
})
