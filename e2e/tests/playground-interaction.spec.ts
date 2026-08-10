import type { Locator, Page } from '@playwright/test'

import { expect, test } from '../fixtures'

/**
 * HTML5 drag & drop.
 *
 * `locator.dragTo()` is the only reliable way to produce real dragstart/dragover/
 * drop events in Chromium — raw `mouse.down()/move()/up()` sequences generate
 * mouse events that never turn into a drag, because CDP drag interception is
 * enabled only inside `dragTo`.
 *
 * The catch is auto-scrolling: if the drop target sits below the fold, `dragTo`
 * scrolls the page WHILE the drag is in flight and the drop lands nowhere. So the
 * whole widget is brought on screen first, and then nothing moves during the drag.
 */
async function html5DragTo(page: Page, source: Locator, target: Locator): Promise<void> {
  await page.getByLabel('Drop slot 3').scrollIntoViewIfNeeded()
  await source.dragTo(target)
}

/**
 * Gesture and timing challenges — the other half of what jsdom cannot do. Every
 * widget mirrors its outcome to a readout with a stable data-testid, so the
 * assertions never read pixels.
 *
 * These pages are pure UI (no API calls), so both projects exercise identical
 * code; running them twice is cheap insurance that the Pages bundle behaves like
 * the dev build.
 */

test.describe('Drag & drop', () => {
  test('an HTML5 drag drops a card into a slot and updates the order readout', async ({ page }) => {
    await page.goto('playground/interactions')

    const readout = page.getByTestId('interactions-dnd-readout')
    await expect(readout).toContainText('—, —, —')

    await html5DragTo(page, page.getByLabel('Draggable card Amber'), page.getByLabel('Drop slot 2'))
    await expect(readout).toContainText('—, Amber, —')

    await html5DragTo(page, page.getByLabel('Draggable card Coral'), page.getByLabel('Drop slot 1'))
    await expect(readout).toContainText('Coral, Amber, —')

    await html5DragTo(page, page.getByLabel('Draggable card Beryl'), page.getByLabel('Drop slot 3'))
    await expect(readout).toContainText('Coral, Amber, Beryl')
  })

  test('the pointer-based sortable reorders with real mouse moves', async ({ page }) => {
    await page.goto('playground/interactions')

    const readout = page.getByTestId('interactions-sortable-readout')
    await expect(readout).toContainText('Red, Green, Blue, Yellow')

    const source = page.getByLabel('Sortable item Red')
    const target = page.getByLabel('Sortable item Blue')
    // boundingBox() is viewport-relative: the widget must be on screen before the
    // raw mouse coordinates below can land on it.
    await target.scrollIntoViewIfNeeded()
    const from = await source.boundingBox()
    const to = await target.boundingBox()
    expect(from && to).toBeTruthy()

    // The widget listens to pointerdown/pointerenter/pointerup, so a one-step
    // teleport would skip the events it reorders on.
    await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2)
    await page.mouse.down()
    await page.mouse.move(to!.x + to!.width / 2, to!.y + to!.height / 2, { steps: 12 })
    await page.mouse.up()

    await expect(readout).toContainText('Green, Blue, Red, Yellow')
  })
})

test.describe('Sliders', () => {
  test('the native range input updates its readout', async ({ page }) => {
    await page.goto('playground/interactions')

    await expect(page.getByTestId('interactions-range-readout')).toContainText('30')

    await page.getByLabel('Native range').fill('70')
    await expect(page.getByTestId('interactions-range-readout')).toContainText('70')
  })

  test('the custom ARIA slider only answers to the keyboard', async ({ page }) => {
    await page.goto('playground/interactions')

    const slider = page.getByRole('slider', { name: 'Custom ARIA slider' })
    await expect(slider).toHaveAttribute('aria-valuenow', '50')

    await slider.focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await expect(slider).toHaveAttribute('aria-valuenow', '60')
    await expect(page.getByTestId('interactions-aria-slider-readout')).toContainText('60')

    await page.keyboard.press('End')
    await expect(slider).toHaveAttribute('aria-valuenow', '100')
  })
})

test.describe('Timing gestures', () => {
  const HOLD_MS = 800

  test('press-and-hold fires only after the hold completes', async ({ page }) => {
    await page.goto('playground/interactions')

    const readout = page.getByTestId('interactions-hold-readout')
    const button = page.getByRole('button', { name: `Press and hold (${HOLD_MS} ms)` })
    await expect(readout).toContainText('idle')

    // A quick tap must NOT register the long press.
    await button.click()
    await expect(readout).toContainText('released too early')

    // Holding past the threshold does. The wait is the behaviour under test, not
    // a guess about timing: the widget's own timer is 800 ms.
    await button.scrollIntoViewIfNeeded()
    const box = await button.boundingBox()
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await page.mouse.down()
    await expect(readout).toContainText('holding…')
    await expect(readout).toContainText('Long press registered!', { timeout: HOLD_MS + 4000 })
    await page.mouse.up()
    await expect(readout).toContainText('Long press registered!')
  })

  test('the cell counts double-clicks only', async ({ page }) => {
    await page.goto('playground/interactions')

    const cell = page.getByTestId('interactions-dblclick-cell')
    const readout = page.getByTestId('interactions-dblclick-readout')
    await expect(readout).toContainText('0')

    await cell.click()
    await expect(readout).toContainText('0')

    await cell.dblclick()
    await expect(readout).toContainText('1')
  })
})

test.describe('Infinite scroll', () => {
  test('scrolling the feed container loads more items', async ({ page }) => {
    await page.goto('playground/dynamic')

    const feed = page.getByTestId('dynamic-feed')
    const count = page.getByTestId('dynamic-feed-count')
    await expect(count).toContainText('10 / 100')

    // The feed has its OWN scrollbar — scrolling the window would do nothing.
    for (let batch = 0; batch < 3; batch += 1) {
      await feed.getByText(`Feed item #${(batch + 1) * 10}`, { exact: true }).scrollIntoViewIfNeeded()
      await expect(count).toContainText(`${(batch + 2) * 10} / 100`)
    }

    await expect(feed.getByText('Feed item #40', { exact: true })).toBeVisible()
  })
})
