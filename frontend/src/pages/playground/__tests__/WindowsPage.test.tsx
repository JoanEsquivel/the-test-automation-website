// ATDD: windows & dialogs page — native confirm/prompt results are echoed into
// page readouts (window.open / new tabs are covered by Playwright, not jsdom).
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDifficultyStore } from '@/playground/difficulty'
import WindowsPage from '../WindowsPage'

beforeEach(() => {
  localStorage.clear()
  useDifficultyStore.setState({ level: 'easy' })
})

describe('WindowsPage', () => {
  it('confirm() readout shows OK when accepted and Cancel when dismissed', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<WindowsPage />)

    fireEvent.click(screen.getByRole('button', { name: /trigger confirm/i }))
    expect(screen.getByTestId('windows-confirm-readout')).toHaveTextContent('OK')

    confirmSpy.mockReturnValue(false)
    fireEvent.click(screen.getByRole('button', { name: /trigger confirm/i }))
    expect(screen.getByTestId('windows-confirm-readout')).toHaveTextContent('Cancel')
  })

  it('prompt() readout echoes the entered text, or notes dismissal', () => {
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('QA rules')
    render(<WindowsPage />)

    fireEvent.click(screen.getByRole('button', { name: /trigger prompt/i }))
    expect(screen.getByTestId('windows-prompt-readout')).toHaveTextContent('QA rules')

    promptSpy.mockReturnValue(null)
    fireEvent.click(screen.getByRole('button', { name: /trigger prompt/i }))
    expect(screen.getByTestId('windows-prompt-readout')).toHaveTextContent(/dismissed/i)
  })

  it('alert() fires the native alert', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined)
    render(<WindowsPage />)
    fireEvent.click(screen.getByRole('button', { name: /trigger alert/i }))
    expect(alertSpy).toHaveBeenCalledOnce()
  })

  it('renders the target=_blank link to the result page', () => {
    render(<WindowsPage />)
    const link = screen.getByRole('link', { name: /open result page in a new tab/i })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('href')).toContain('/frames/result')
  })

  it('shows the handshake value from localStorage once the result page wrote it', async () => {
    render(<WindowsPage />)
    expect(screen.getByTestId('windows-handshake-readout')).toHaveTextContent(/waiting/i)
    localStorage.setItem('taw:handshake', 'hello-from-result')
    expect(await screen.findByText(/hello-from-result/)).toBeInTheDocument()
  })
})
