// ATDD: mode resolution rules from docs/02-specs/dual-mode-architecture.md.
import { beforeEach, describe, expect, it } from 'vitest'

import { MODE_KEY, resolveMode } from '../mode'

beforeEach(() => {
  localStorage.clear()
})

describe('resolveMode', () => {
  it('forces browser mode on the Pages build and disables the toggle', async () => {
    const result = await resolveMode({ forceBrowser: true, healthCheck: async () => true })
    expect(result).toEqual({ mode: 'browser', forced: true, fallback: false })
  })

  it('honors a stored browser preference without a health check', async () => {
    localStorage.setItem(MODE_KEY, 'browser')
    const result = await resolveMode({
      forceBrowser: false,
      healthCheck: async () => {
        throw new Error('should not be called')
      },
    })
    expect(result).toEqual({ mode: 'browser', forced: false, fallback: false })
  })

  it('keeps a stored backend preference when the backend is healthy', async () => {
    localStorage.setItem(MODE_KEY, 'backend')
    const result = await resolveMode({ forceBrowser: false, healthCheck: async () => true })
    expect(result).toEqual({ mode: 'backend', forced: false, fallback: false })
  })

  it('falls back to browser mode with a warning when the stored backend is unreachable', async () => {
    localStorage.setItem(MODE_KEY, 'backend')
    const result = await resolveMode({ forceBrowser: false, healthCheck: async () => false })
    expect(result).toEqual({ mode: 'browser', forced: false, fallback: true })
  })

  it('picks backend on first visit when the health check succeeds', async () => {
    const result = await resolveMode({ forceBrowser: false, healthCheck: async () => true })
    expect(result).toEqual({ mode: 'backend', forced: false, fallback: false })
  })

  it('picks browser on first visit without a warning when the backend is absent', async () => {
    const result = await resolveMode({ forceBrowser: false, healthCheck: async () => false })
    expect(result).toEqual({ mode: 'browser', forced: false, fallback: false })
  })
})
