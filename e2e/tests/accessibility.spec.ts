import AxeBuilder from '@axe-core/playwright'

import { expect, test } from '../fixtures'
import { waitForCatalog } from '../support/actions'

/**
 * Automated accessibility gate.
 *
 * Scope: the pages a visitor actually uses to get things done. The Playground's
 * component pages are deliberately excluded — half of their widgets are LEGACY
 * ANTI-PATTERNS (div-as-button, unlabelled inputs, colour-only state) that exist
 * precisely so people can practise against bad markup. Scanning them would fail
 * the build for defects that are the product. The Playground HUB is scanned,
 * because it is ordinary navigation.
 *
 * Threshold: zero violations at impact `serious` or `critical`. Moderate and
 * minor are reported in the failure message when a scan does fail, but do not
 * block; anything above that is a real defect and must be fixed in the app.
 */

const BLOCKING_IMPACTS = new Set(['serious', 'critical'])

const PAGES = [
  { name: 'home', path: './' },
  { name: 'playground hub', path: 'playground' },
  { name: 'shop intro', path: 'shop' },
  { name: 'catalog', path: 'shop/catalog' },
  { name: 'cart', path: 'shop/cart' },
  { name: 'login', path: 'account/login' },
]

for (const target of PAGES) {
  test(`${target.name} has no serious or critical accessibility violations`, async ({ page }) => {
    await page.goto(target.path)

    // Scan settled markup only: a skeleton is not the page under test.
    if (target.path === 'shop/catalog') await waitForCatalog(page)
    if (target.path === 'shop/cart') await expect(page.getByTestId('empty-cart')).toBeVisible()

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const blocking = results.violations.filter((violation) =>
      BLOCKING_IMPACTS.has(violation.impact ?? ''),
    )

    expect(
      blocking,
      blocking
        .map(
          (violation) =>
            `[${violation.impact}] ${violation.id}: ${violation.help}\n` +
            violation.nodes.map((node) => `    ${node.target.join(' ')}`).join('\n'),
        )
        .join('\n'),
    ).toEqual([])
  })
}
