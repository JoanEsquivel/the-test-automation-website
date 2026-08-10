import { expect, test } from '../fixtures'
import { loginAs } from '../support/actions'
import { ADMIN, CUSTOMER } from '../support/constants'

/**
 * Role-based access control, asserted in both projects: the JWT role check lives
 * in two implementations (engine/auth.ts and app/core/security.py) and both must
 * answer the same way.
 */
test.describe('Admin area', () => {
  test('an admin sees the dashboard tiles', async ({ page }) => {
    await loginAs(page, ADMIN.email, ADMIN.password)

    // The Admin shortcut only renders for the admin role.
    await expect(page.getByTestId('admin-link')).toBeVisible()
    await page.getByTestId('admin-link').click()
    await expect(page).toHaveURL(/\/admin$/)

    await expect(page.getByTestId('admin-nav')).toBeVisible()
    await expect(page.getByTestId('stat-total-revenue')).toBeVisible()
    await expect(page.getByTestId('stat-order-count')).toBeVisible()
    await expect(page.getByTestId('stat-avg-order-value')).toBeVisible()
    await expect(page.getByTestId('stat-low-stock')).toBeVisible()
    await expect(page.getByTestId('admin-stats-error')).toHaveCount(0)

    // Every tile carries a real value, not a placeholder.
    await expect(page.getByTestId('stat-total-revenue')).toContainText('$')
    await expect(page.getByTestId('stat-order-count')).toContainText(/\d+/)
  })

  test('a customer hitting /admin gets the 403 page', async ({ page }) => {
    await loginAs(page, CUSTOMER.email, CUSTOMER.password)

    await expect(page.getByTestId('admin-link')).toHaveCount(0)

    await page.goto('admin')
    await expect(page.getByTestId('forbidden')).toBeVisible()
    await expect(page.getByTestId('forbidden')).toContainText('403 — Forbidden')
    await expect(page.getByTestId('forbidden')).toContainText(CUSTOMER.email)
    await expect(page.getByTestId('stat-total-revenue')).toHaveCount(0)
    await expect(page.getByTestId('forbidden-home-link')).toBeVisible()
  })

  test('an anonymous visitor is redirected to login with a returnTo', async ({ page }) => {
    await page.goto('admin')

    await expect(page).toHaveURL(/\/account\/login\?returnTo=%2Fadmin/)
    await expect(page.getByTestId('login-form')).toBeVisible()
  })
})
