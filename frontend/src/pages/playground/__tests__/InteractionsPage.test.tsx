// ATDD: interaction challenges — keyboard-only listbox, context menu log,
// press-and-hold timing and the native range readout. Real drag/hover/canvas
// gestures are Playwright territory.
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDifficultyStore } from '@/playground/difficulty'
import InteractionsPage from '../InteractionsPage'

beforeEach(() => {
  localStorage.clear()
  useDifficultyStore.setState({ level: 'easy' })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('InteractionsPage', () => {
  it('keyboard-only listbox ignores mouse clicks but selects with arrows + Enter', () => {
    render(<InteractionsPage />)
    const listbox = screen.getByRole('listbox', { name: /keyboard-only/i })

    fireEvent.mouseDown(screen.getByRole('option', { name: /bravo/i }))
    fireEvent.click(screen.getByRole('option', { name: /bravo/i }))
    expect(screen.getByTestId('interactions-keyboard-readout')).toHaveTextContent('none')

    listbox.focus()
    fireEvent.keyDown(listbox, { key: 'ArrowDown' })
    fireEvent.keyDown(listbox, { key: 'ArrowDown' })
    fireEvent.keyDown(listbox, { key: 'Enter' })
    expect(screen.getByTestId('interactions-keyboard-readout')).toHaveTextContent('Bravo')
  })

  it('context menu opens on right-click and logs the chosen action', () => {
    render(<InteractionsPage />)
    const zone = screen.getByTestId('interactions-context-zone')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    fireEvent.contextMenu(zone)
    const menu = screen.getByRole('menu')

    fireEvent.click(within(menu).getByRole('menuitem', { name: /copy/i }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    const log = screen.getByTestId('interactions-context-log')
    expect(within(log).getAllByRole('listitem')).toHaveLength(1)
    expect(log).toHaveTextContent(/copy/i)
  })

  it('press-and-hold fires only after 800 ms of holding', () => {
    vi.useFakeTimers()
    render(<InteractionsPage />)
    const button = screen.getByRole('button', { name: /press and hold/i })

    fireEvent.pointerDown(button)
    act(() => {
      vi.advanceTimersByTime(700)
    })
    expect(screen.getByTestId('interactions-hold-readout')).not.toHaveTextContent(
      /long press registered/i,
    )

    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(screen.getByTestId('interactions-hold-readout')).toHaveTextContent(
      /long press registered/i,
    )
  })

  it('press-and-hold released early does not fire', () => {
    vi.useFakeTimers()
    render(<InteractionsPage />)
    const button = screen.getByRole('button', { name: /press and hold/i })

    fireEvent.pointerDown(button)
    act(() => {
      vi.advanceTimersByTime(300)
    })
    fireEvent.pointerUp(button)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByTestId('interactions-hold-readout')).toHaveTextContent(/too early/i)
  })

  it('native range slider updates its readout', () => {
    render(<InteractionsPage />)
    const slider = screen.getByRole('slider', { name: /native range/i })
    fireEvent.change(slider, { target: { value: '70' } })
    expect(screen.getByTestId('interactions-range-readout')).toHaveTextContent('70')
  })

  it('custom ARIA slider responds to arrow keys', () => {
    render(<InteractionsPage />)
    const slider = screen.getByRole('slider', { name: /custom aria slider/i })
    expect(slider).toHaveAttribute('aria-valuenow', '50')
    fireEvent.keyDown(slider, { key: 'ArrowRight' })
    expect(slider).toHaveAttribute('aria-valuenow', '55')
    fireEvent.keyDown(slider, { key: 'ArrowLeft' })
    fireEvent.keyDown(slider, { key: 'ArrowLeft' })
    expect(slider).toHaveAttribute('aria-valuenow', '45')
  })

  it('double-click cell reacts only to double clicks', () => {
    render(<InteractionsPage />)
    const cell = screen.getByTestId('interactions-dblclick-cell')
    fireEvent.click(cell)
    expect(screen.getByTestId('interactions-dblclick-readout')).toHaveTextContent('0')
    fireEvent.doubleClick(cell)
    expect(screen.getByTestId('interactions-dblclick-readout')).toHaveTextContent('1')
  })
})
