import { expect, type Page } from '@playwright/test'

import { CUSTOMER } from './constants'

/**
 * Small, shared flows used by more than one spec. Everything in here is
 * mode-agnostic on purpose: the parity gate only means something if both
 * projects execute the very same steps.
 */

/** Log in through the real form (never by injecting a token). */
export async function login(page: Page, email: string, password: string): Promise<void> {
  await expect(page.getByTestId('login-form')).toBeVisible()
  await page.getByTestId('login-email').fill(email)
  await page.getByTestId('login-password').fill(password)
  await page.getByTestId('login-submit').click()
  // The header log-out button appears as soon as the token is stored, which is
  // BEFORE the page redirects. Waiting for the form to go away too means callers
  // never race the pending `navigate(returnTo)` with their own navigation.
  await expect(page.getByTestId('logout-button')).toBeVisible()
  await expect(page.getByTestId('login-form')).toHaveCount(0)
}

/** Go straight to the login page and sign in. */
export async function loginAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto('account/login')
  await login(page, email, password)
}

export async function logout(page: Page): Promise<void> {
  await page.getByTestId('logout-button').click()
  await expect(page.getByTestId('login-link')).toBeVisible()
}

/** Wait for the catalog grid to finish its first fetch. */
export async function waitForCatalog(page: Page): Promise<void> {
  await expect(page.getByTestId('catalog-result-count')).not.toHaveText(/Loading/)
}

/**
 * Narrow the catalog with the debounced (300 ms) search box and wait for the
 * live result count to settle on `expectedCount` — no sleep, the assertion
 * simply retries until the debounce has fired and the fetch has resolved.
 */
export async function searchCatalog(page: Page, term: string, expectedCount: number): Promise<void> {
  await page.getByTestId('catalog-search').fill(term)
  await expect(page.getByTestId('catalog-result-count')).toHaveText(`${expectedCount} product(s) found`)
}

/**
 * Precondition for the checkout parity gate: the seeded customer starts with an
 * empty account cart.
 *
 * Browser mode is isolated by construction — every test gets a fresh browser
 * context, so localStorage is reseeded. Backend mode is NOT: the FastAPI process
 * holds the account cart in memory, so a previous run (or the declined-payment
 * test, which deliberately leaves the cart intact) would poison the totals when
 * the guest cart merges on login. Emptying it through the real UI keeps the two
 * projects behaviourally identical.
 */
export async function ensureEmptyCustomerCart(page: Page): Promise<void> {
  await loginAs(page, CUSTOMER.email, CUSTOMER.password)
  await page.goto('shop/cart')

  // The cart is fetched asynchronously: counting remove buttons before it lands
  // would silently "find" an empty cart. Wait for the page to settle on one of
  // its two terminal states first.
  await expect(
    page.getByTestId('empty-cart').or(page.getByTestId('cart-item-count')),
  ).toBeVisible()

  const removeCoupon = page.getByTestId('remove-coupon')
  if (await removeCoupon.isVisible()) {
    await removeCoupon.click()
    await expect(removeCoupon).toBeHidden()
  }

  const removeButtons = page.locator('[data-testid^="remove-item-"]')
  let remaining = await removeButtons.count()
  while (remaining > 0) {
    await removeButtons.first().click()
    remaining -= 1
    await expect(removeButtons).toHaveCount(remaining)
  }

  await expect(page.getByTestId('empty-cart')).toBeVisible()
  await logout(page)
}
