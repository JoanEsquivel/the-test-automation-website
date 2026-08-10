// ATDD: dynamic & async challenges — delayed appearance honors the shared delay
// slider, text swap keeps node identity, toasts auto-dismiss after the delay.
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDifficultyStore } from '@/playground/difficulty'
import DynamicPage from '../DynamicPage'

beforeEach(() => {
  localStorage.clear()
  useDifficultyStore.setState({ level: 'easy' })
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('DynamicPage', () => {
  it('always exposes the delay slider test id and its value readout', () => {
    render(<DynamicPage />)
    expect(screen.getByTestId('delay-slider')).toBeInTheDocument()
    expect(screen.getByTestId('delay-value')).toHaveTextContent('2000')
    useDifficultyStore.setState({ level: 'evil' })
    expect(screen.getByTestId('delay-slider')).toBeInTheDocument()
  })

  it('delayed appearance spawns the element only after the configured delay', () => {
    render(<DynamicPage />)
    fireEvent.change(screen.getByTestId('delay-slider'), { target: { value: '1000' } })
    expect(screen.getByTestId('delay-value')).toHaveTextContent('1000')

    fireEvent.click(screen.getByRole('button', { name: /spawn element/i }))
    expect(screen.queryByTestId('dynamic-appear-target')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(screen.queryByTestId('dynamic-appear-target')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(screen.getByTestId('dynamic-appear-target')).toBeInTheDocument()
  })

  it('text swap changes the text without replacing the DOM node', () => {
    render(<DynamicPage />)
    const node = screen.getByTestId('dynamic-text-swap')

    fireEvent.click(screen.getByRole('button', { name: /start text swap/i }))
    expect(node).toHaveTextContent('Loading…')

    act(() => {
      vi.advanceTimersByTime(2100)
    })
    expect(screen.getByTestId('dynamic-text-swap')).toBe(node)
    expect(node).toHaveTextContent('Ready!')
  })

  it('toasts auto-dismiss after the delay', () => {
    render(<DynamicPage />)
    fireEvent.click(screen.getByRole('button', { name: /success toast/i }))
    expect(screen.getByTestId('toast-success')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(2600)
    })
    expect(screen.queryByTestId('toast-success')).not.toBeInTheDocument()
  })

  it('progress bar completes after the delay and shows the banner', () => {
    render(<DynamicPage />)
    expect(screen.getByTestId('dynamic-progress-status')).toHaveTextContent(/idle/i)

    fireEvent.click(screen.getByRole('button', { name: /start progress/i }))
    expect(screen.getByTestId('dynamic-progress-status')).toHaveTextContent(/running/i)

    act(() => {
      vi.advanceTimersByTime(2600)
    })
    expect(screen.getByTestId('dynamic-progress-status')).toHaveTextContent(/complete/i)
    expect(screen.getByTestId('dynamic-progress-banner')).toBeInTheDocument()
  })

  it('stale element trap re-renders the list with a new generation every 3 s', () => {
    render(<DynamicPage />)
    expect(screen.getByTestId('dynamic-stale-generation')).toHaveTextContent('1')

    act(() => {
      vi.advanceTimersByTime(3100)
    })
    expect(screen.getByTestId('dynamic-stale-generation')).toHaveTextContent('2')
  })
})
