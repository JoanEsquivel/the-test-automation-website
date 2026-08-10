// ATDD: shadow DOM page — custom elements registered, open root mirrors its
// value to a light-DOM host attribute, closed root exposes no shadowRoot.
import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useDifficultyStore } from '@/playground/difficulty'
import ShadowPage from '../ShadowPage'

beforeEach(() => {
  localStorage.clear()
  useDifficultyStore.setState({ level: 'easy' })
})

describe('ShadowPage', () => {
  it('registers the three shadow custom elements', () => {
    render(<ShadowPage />)
    expect(customElements.get('taw-shadow-input')).toBeDefined()
    expect(customElements.get('taw-shadow-counter')).toBeDefined()
    expect(customElements.get('taw-shadow-vault')).toBeDefined()
  })

  it('typing inside the open shadow root mirrors the value to data-value on the host', async () => {
    const { container } = render(<ShadowPage />)
    const host = container.querySelector('taw-shadow-input')
    expect(host).not.toBeNull()
    const root = host?.shadowRoot
    expect(root).not.toBeNull()

    const input = root?.querySelector('input')
    expect(input).not.toBeNull()
    if (!input || !host) throw new Error('shadow input missing')
    input.value = 'hello shadow'
    input.dispatchEvent(new Event('input', { bubbles: true }))

    await waitFor(() => expect(host.getAttribute('data-value')).toBe('hello shadow'))
  })

  it('the nested counter mirrors its count to the host', async () => {
    const { container } = render(<ShadowPage />)
    const host = container.querySelector('taw-shadow-counter')
    expect(host).not.toBeNull()
    if (!host) throw new Error('counter host missing')
    const root = host.shadowRoot
    expect(root).not.toBeNull()

    const increment = root?.querySelector<HTMLButtonElement>('button[data-action="increment"]')
    expect(increment).not.toBeNull()
    increment?.click()
    await waitFor(() => expect(host.getAttribute('data-count')).toBe('1'))

    // nested open shadow element lives INSIDE the counter's shadow root
    const nested = root?.querySelector('taw-shadow-display')
    expect(nested).not.toBeNull()
    expect(nested?.shadowRoot).not.toBeNull()
  })

  it('the vault host exposes NO shadowRoot (closed mode)', () => {
    const { container } = render(<ShadowPage />)
    const vault = container.querySelector('taw-shadow-vault')
    expect(vault).not.toBeNull()
    expect(vault?.shadowRoot).toBeNull()
  })
})
