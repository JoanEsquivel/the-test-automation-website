// ATDD: frames page — iframes render with titles and base-path-aware srcs.
// Interacting INSIDE the frames is Playwright territory (jsdom does not load
// iframe documents), so here we assert the embedding contract only.
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useDifficultyStore } from '@/playground/difficulty'
import FramesPage from '../FramesPage'

beforeEach(() => {
  localStorage.clear()
  useDifficultyStore.setState({ level: 'easy' })
})

describe('FramesPage', () => {
  it('embeds the single iframe pointing at /frames/inner-form', () => {
    render(<FramesPage />)
    const frame = screen.getByTitle(/inner form frame/i)
    expect(frame.tagName).toBe('IFRAME')
    expect(frame.getAttribute('src')).toContain('/frames/inner-form')
  })

  it('embeds the nested iframe pointing at /frames/outer', () => {
    render(<FramesPage />)
    const frame = screen.getByTitle(/nested frame/i)
    expect(frame.tagName).toBe('IFRAME')
    expect(frame.getAttribute('src')).toContain('/frames/outer')
  })
})
