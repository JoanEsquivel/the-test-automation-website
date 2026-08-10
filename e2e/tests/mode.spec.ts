import { expect, test } from '../fixtures'

/**
 * Proves the dual-mode plumbing itself: the same page, driven by the same spec,
 * reports the mode it is actually running in. If this file fails, every parity
 * assertion in the rest of the suite is meaningless.
 */
test.describe('API mode control', () => {
  test('the header pill reports the active API mode', async ({ page, apiMode }) => {
    await page.goto('./')

    await expect(page.getByTestId('api-mode-indicator')).toHaveText(
      apiMode === 'backend' ? 'BACKEND :8000' : 'IN-BROWSER',
    )
    await expect(page.getByTestId('api-mode-toggle')).toHaveAttribute(
      'aria-checked',
      apiMode === 'backend' ? 'true' : 'false',
    )
  })

  test('the toggle is locked and explained on the browser-only build', async ({ page, apiMode }) => {
    await page.goto('./')

    if (apiMode === 'browser') {
      // The Pages bundle is built with VITE_FORCE_BROWSER_MODE=true: there is no
      // backend to switch to, so the control is disabled and says why.
      await expect(page.getByTestId('api-mode-toggle')).toBeDisabled()
      await expect(page.getByTestId('forced-browser-banner')).toBeVisible()
    } else {
      await expect(page.getByTestId('api-mode-toggle')).toBeEnabled()
      await expect(page.getByTestId('forced-browser-banner')).toHaveCount(0)
    }
  })

  test('the store pre-screen echoes the same mode', async ({ page, apiMode }) => {
    await page.goto('shop')

    await expect(page.getByTestId('mode-warning-pill')).toHaveText(
      apiMode === 'backend' ? 'Now running: Backend mode' : 'Now running: Browser mode',
    )
  })
})
