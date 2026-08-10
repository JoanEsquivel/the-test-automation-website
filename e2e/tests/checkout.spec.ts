import { expect, test } from '../fixtures'
import { ensureEmptyCustomerCart, login, searchCatalog, waitForCatalog } from '../support/actions'
import {
  CARDS,
  CUSTOMER,
  expectedTotals,
  FIXTURE_PRODUCT,
  ORDER_NUMBER_PATTERN,
} from '../support/constants'

/**
 * THE PARITY GATE.
 *
 * One journey — home → store pre-screen → catalog → cart → login → 3-step
 * checkout → confirmation → order history — asserted with byte-identical
 * expectations in both projects. The in-browser engine and the FastAPI backend
 * are two independent implementations of docs/02-specs/api-contract.md; if this
 * file passes in one project and fails in the other, the implementations have
 * drifted and the APPLICATION is wrong, not the test.
 */

const TOTALS = expectedTotals(FIXTURE_PRODUCT.price, 1)

/** Home → /shop → /shop/catalog, then add the fixture product to a guest cart. */
async function addFixtureProductAsGuest(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('./')
  await page.getByTestId('path-store').click()
  await expect(page).toHaveURL(/\/shop$/)

  await page.getByTestId('enter-store').click()
  await expect(page).toHaveURL(/\/shop\/catalog/)
  await waitForCatalog(page)

  await searchCatalog(page, FIXTURE_PRODUCT.name, 1)
  await expect(page.getByTestId(`product-price-${FIXTURE_PRODUCT.id}`)).toHaveText(TOTALS.subtotal)

  await page.getByTestId(`add-to-cart-${FIXTURE_PRODUCT.id}`).click()
  // The badge bumps OPTIMISTICALLY, so it is not proof the API accepted the item.
  // The toast is only raised once the request has resolved — wait for that before
  // navigating, otherwise the cart page can GET before the POST lands.
  await expect(page.getByTestId('toast')).toContainText(`${FIXTURE_PRODUCT.name} added to your cart.`)
  await expect(page.getByTestId('cart-count')).toHaveText('1')
}

test.describe('Store checkout', () => {
  test.beforeEach(async ({ page }) => {
    await ensureEmptyCustomerCart(page)
  })

  test('a guest can shop, sign in and place an approved order', async ({ page }) => {
    await addFixtureProductAsGuest(page)

    // --- cart: the normative money rules, recomputed independently of the app.
    await page.getByTestId('cart-link').click()
    await expect(page).toHaveURL(/\/shop\/cart/)
    await expect(page.getByTestId('cart-item-count')).toHaveText('1 line(s) in your cart')
    await expect(page.getByTestId(`cart-item-name-${FIXTURE_PRODUCT.id}`)).toHaveText(FIXTURE_PRODUCT.name)
    await expect(page.getByTestId('totals-subtotal')).toHaveText(TOTALS.subtotal)
    await expect(page.getByTestId('totals-shipping')).toHaveText(TOTALS.shipping)
    await expect(page.getByTestId('totals-tax')).toHaveText(TOTALS.tax)
    await expect(page.getByTestId('totals-total')).toHaveText(TOTALS.total)

    // --- checkout is gated: the guest is bounced to login and sent straight back.
    await page.getByTestId('proceed-to-checkout').click()
    await expect(page).toHaveURL(/\/account\/login\?returnTo=/)
    await login(page, CUSTOMER.email, CUSTOMER.password)
    await expect(page).toHaveURL(/\/shop\/checkout/)

    // The guest cart merged into the account cart — the totals must survive it.
    await expect(page.getByTestId('checkout-step')).toHaveAttribute('data-step', 'shipping')

    // --- step 1: the seeded default address is preselected.
    await expect(page.getByTestId('address-option-addr-home')).toBeChecked()
    await page.getByTestId('shipping-continue').click()
    await expect(page.getByTestId('checkout-step')).toHaveAttribute('data-step', 'payment')

    // --- step 2: the approved card.
    await page.getByTestId('card-number').fill(CARDS.approved)
    await page.getByTestId('card-expiry').fill(CARDS.expiry)
    await page.getByTestId('card-cvc').fill(CARDS.cvc)
    await page.getByTestId('card-holder').fill(CARDS.holder)
    await page.getByTestId('payment-continue').click()
    await expect(page.getByTestId('checkout-step')).toHaveAttribute('data-step', 'review')

    // --- step 3: review then place.
    await expect(page.getByTestId('review-last4')).toHaveText('1111')
    await expect(page.getByTestId(`review-item-${FIXTURE_PRODUCT.id}`)).toContainText(FIXTURE_PRODUCT.name)
    await expect(page.getByTestId('totals-total')).toHaveText(TOTALS.total)
    await page.getByTestId('place-order').click()

    // --- confirmation.
    await expect(page).toHaveURL(/\/shop\/orders\/[^/]+\/confirmation/)
    await expect(page.getByTestId('confirmation-hero')).toBeVisible()
    const orderNumber = (await page.getByTestId('order-number').innerText()).trim()
    expect(orderNumber).toMatch(ORDER_NUMBER_PATTERN)
    await expect(page.getByTestId('confirmation-total')).toHaveText(TOTALS.total)

    // The cart was emptied by the API, so the header badge is back to zero.
    await expect(page.getByTestId('cart-count')).toHaveText('0')

    // --- order history lists exactly this order.
    await page.getByTestId('view-order-history').click()
    await expect(page).toHaveURL(/\/shop\/orders$/)
    await expect(page.getByTestId('orders-table')).toBeVisible()
    await expect(page.getByTestId(`order-link-${orderNumber}`)).toHaveText(orderNumber)
    await expect(page.getByTestId(`order-row-${orderNumber}`)).toContainText(TOTALS.total)
  })

  test('a declined card keeps the visitor on the payment step', async ({ page }) => {
    await addFixtureProductAsGuest(page)

    await page.getByTestId('cart-link').click()
    await page.getByTestId('proceed-to-checkout').click()
    await login(page, CUSTOMER.email, CUSTOMER.password)
    await expect(page).toHaveURL(/\/shop\/checkout/)

    await page.getByTestId('shipping-continue').click()
    // Any card ending in 0000 is declined by both implementations.
    await page.getByTestId('card-number').fill(CARDS.declined)
    await page.getByTestId('card-expiry').fill(CARDS.expiry)
    await page.getByTestId('card-cvc').fill(CARDS.cvc)
    await page.getByTestId('card-holder').fill(CARDS.holder)
    await page.getByTestId('payment-continue').click()
    await expect(page.getByTestId('checkout-step')).toHaveAttribute('data-step', 'review')

    await page.getByTestId('place-order').click()

    // PAYMENT_DECLINED → the API message is shown verbatim and the wizard rewinds
    // to the only step that can fix it. No order is created and the cart survives.
    await expect(page.getByTestId('checkout-error')).toBeVisible()
    await expect(page.getByTestId('checkout-error')).toContainText(/declined/i)
    await expect(page.getByTestId('checkout-step')).toHaveAttribute('data-step', 'payment')
    await expect(page).toHaveURL(/\/shop\/checkout/)
    await expect(page.getByTestId('cart-count')).toHaveText('1')
  })
})
