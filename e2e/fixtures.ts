import { test as base, expect, type Page } from '@playwright/test'

import { MODE_KEY, type ApiMode } from './support/constants'

export interface TawFixtures {
  /** Which API the app is talking to for this test — derived from the project name. */
  apiMode: ApiMode
}

/**
 * The whole point of the two projects is that the specs do not know which one they
 * are in. The only mode-specific setup lives here:
 *
 * - backend-mode seeds `localStorage['taw:apiMode'] = 'backend'` with an init script
 *   so it is in place BEFORE `main.tsx` calls `resolveMode()` — otherwise the first
 *   visit would probe the backend and, worse, register the MSW service worker.
 * - browser-mode needs nothing: the Pages bundle is built with
 *   VITE_FORCE_BROWSER_MODE=true, so the mode is forced regardless of storage.
 */
export const test = base.extend<TawFixtures>({
  apiMode: async ({}, use, testInfo) => {
    await use(testInfo.project.name === 'backend-mode' ? 'backend' : 'browser')
  },

  page: async ({ page, apiMode }, use) => {
    if (apiMode === 'backend') {
      await page.addInitScript(
        ([key, value]) => window.localStorage.setItem(key, value),
        [MODE_KEY, 'backend'] as const,
      )
    }
    await use(page)
  },
})

export { expect }
export type { Page }
