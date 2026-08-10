// ATDD: navigation playground — ARIA tabs (click + arrow keys) and accordion.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { useDifficultyStore } from '@/playground/difficulty'
import NavigationPage from '../NavigationPage'

beforeEach(() => {
  localStorage.clear()
  useDifficultyStore.setState({ level: 'easy' })
})

describe('NavigationPage', () => {
  it('switches tab panels on click', async () => {
    const user = userEvent.setup()
    render(<NavigationPage />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(3)
    expect(screen.getByRole('tab', { name: 'Selenium' })).toHaveAttribute('aria-selected', 'false')
    await user.click(screen.getByRole('tab', { name: 'Selenium' }))
    expect(screen.getByRole('tab', { name: 'Selenium' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent(/selenium/i)
  })

  it('moves and activates tabs with arrow keys', async () => {
    const user = userEvent.setup()
    render(<NavigationPage />)
    await user.click(screen.getByRole('tab', { name: 'Playwright' }))
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Selenium' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent(/selenium/i)
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'Playwright' })).toHaveAttribute('aria-selected', 'true')
  })

  it('opens the details/summary accordion', async () => {
    const user = userEvent.setup()
    render(<NavigationPage />)
    const summary = screen.getByText(/why native details wins/i)
    await user.click(summary)
    expect(screen.getByText(/keyboard support and semantics for free/i)).toBeVisible()
  })

  it('opens the ARIA disclosure accordion', async () => {
    const user = userEvent.setup()
    render(<NavigationPage />)
    const trigger = screen.getByRole('button', { name: /how disclosures work/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/aria-expanded flips/i)).toBeVisible()
  })

  it('renders breadcrumb and pagination widgets', async () => {
    const user = userEvent.setup()
    render(<NavigationPage />)
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument()
    const pagination = screen.getByRole('navigation', { name: /pagination/i })
    expect(pagination).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^page 3$/i }))
    expect(screen.getByTestId('navigation-pagination-readout')).toHaveTextContent('3')
  })
})
