// ATDD: written before locators.ts exists. The locator attribute system must
// expose rich hooks at easy level, strip test ids at medium, and randomize at evil.
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useDifficultyStore } from '@/playground/difficulty'
import { useLocatorAttrs } from '@/playground/locators'

function Probe() {
  const attrs = useLocatorAttrs()
  return (
    <input
      aria-label="probe"
      {...attrs('probe-field', { id: 'probe-id', name: 'probe', className: 'probe-class' })}
    />
  )
}

beforeEach(() => {
  localStorage.clear()
  useDifficultyStore.setState({ level: 'easy' })
})

describe('useLocatorAttrs', () => {
  it('easy: exposes data-testid, id, name and className', () => {
    render(<Probe />)
    const input = screen.getByLabelText('probe')
    expect(input).toHaveAttribute('data-testid', 'probe-field')
    expect(input).toHaveAttribute('id', 'probe-id')
    expect(input).toHaveAttribute('name', 'probe')
    expect(input.className).toContain('probe-class')
  })

  it('medium: drops data-testid and id but keeps semantic className and name', () => {
    useDifficultyStore.setState({ level: 'medium' })
    render(<Probe />)
    const input = screen.getByLabelText('probe')
    expect(input).not.toHaveAttribute('data-testid')
    expect(input).not.toHaveAttribute('id')
    expect(input).toHaveAttribute('name', 'probe')
    expect(input.className).toContain('probe-class')
  })

  it('evil: drops test id and name, generates obfuscated id/class', () => {
    useDifficultyStore.setState({ level: 'evil' })
    render(<Probe />)
    const input = screen.getByLabelText('probe')
    expect(input).not.toHaveAttribute('data-testid')
    expect(input).not.toHaveAttribute('name')
    expect(input.id).toMatch(/^x-/)
    expect(input.className).toMatch(/css-/)
  })

  it('evil: ids differ between two mounts of the same component', () => {
    useDifficultyStore.setState({ level: 'evil' })
    const first = render(<Probe />)
    const firstId = screen.getByLabelText('probe').id
    first.unmount()
    render(<Probe />)
    const secondId = screen.getByLabelText('probe').id
    expect(firstId).toMatch(/^x-/)
    expect(secondId).toMatch(/^x-/)
    expect(secondId).not.toBe(firstId)
  })
})
