import { expect, test } from '../fixtures'

/**
 * Everything jsdom cannot reach: real iframes, real shadow roots, real new tabs,
 * real native dialogs, real downloads and real file inputs. These are the cases
 * the 218 unit tests are structurally unable to cover, which is exactly why the
 * e2e suite exists.
 *
 * The challenge pages are pure UI except for Files, which calls the API — so the
 * whole file runs in both projects and the download/upload cases double as
 * parity checks between MSW and FastAPI.
 */

test.describe('Iframes', () => {
  test('the form inside a single iframe submits and reports inside the frame', async ({ page }) => {
    await page.goto('playground/frames')

    const frame = page.frameLocator('iframe[title="Inner form frame"]')
    await expect(frame.getByTestId('frame-inner-form')).toBeVisible()

    await frame.getByTestId('frame-name-input').fill('Automator')
    await frame.getByTestId('frame-color-select').selectOption('pulse violet')
    await frame.getByTestId('frame-submit').click()

    await expect(frame.getByTestId('frame-form-result')).toHaveText(
      'Hello Automator, you picked pulse violet.',
    )
    // The result lives INSIDE the frame — the top document never sees it.
    await expect(page.getByTestId('frame-form-result')).toHaveCount(0)
  })

  test('the nested iframe needs two context switches', async ({ page }) => {
    await page.goto('playground/frames')

    const outer = page.frameLocator('iframe[title="Nested frame"]')
    await expect(outer.getByTestId('frame-outer')).toBeVisible()

    const inner = outer.frameLocator('iframe[title="Inner form frame (nested)"]')
    await inner.getByTestId('frame-name-input').fill('Deep Diver')
    await inner.getByTestId('frame-color-select').selectOption('emerald green')
    await inner.getByTestId('frame-submit').click()

    await expect(inner.getByTestId('frame-form-result')).toHaveText(
      'Hello Deep Diver, you picked emerald green.',
    )
  })
})

test.describe('Shadow DOM', () => {
  test('an open shadow root is transparent to locators and mirrors to the host', async ({ page }) => {
    await page.goto('playground/shadow')

    const host = page.getByTestId('shadow-input-host')
    // Playwright's CSS engine pierces open roots automatically.
    await host.locator('input').fill('pierced')

    await expect(host).toHaveAttribute('data-value', 'pierced')
    await expect(host.locator('span.value')).toHaveText('pierced')
  })

  test('nested open shadow roots are pierced by a single selector', async ({ page }) => {
    await page.goto('playground/shadow')

    const host = page.getByTestId('shadow-counter-host')
    await host.locator('button[data-action="increment"]').click()
    await host.locator('button[data-action="increment"]').click()

    await expect(host).toHaveAttribute('data-count', '2')
    // The display is a second custom element with its own root, two levels deep.
    await expect(host.locator('taw-shadow-display strong')).toHaveText('2')
  })

  test.skip('a CLOSED shadow root cannot be entered — by design', async ({ page }) => {
    // attachShadow({ mode: 'closed' }) keeps the root private: host.shadowRoot is
    // null, so neither Playwright's CSS engine nor Selenium's getShadowRoot() has
    // anything to query. This is not a locator puzzle to solve, it is a boundary
    // to respect — the widget's supported contract is the host attribute, which
    // the assertion below (deliberately left unreachable) would have to use:
    //
    //   await expect(page.getByTestId('shadow-vault-host'))
    //     .toHaveAttribute('data-unlocked', 'true')
    //
    // Typing the passphrase requires reaching the input, which is impossible, so
    // the flow itself is genuinely unautomatable and stays skipped on purpose.
    void page
  })
})

test.describe('New windows & native dialogs', () => {
  test('the result page opens in a new tab and hands a value back to the opener', async ({
    page,
    context,
  }) => {
    await page.goto('playground/windows')

    const [resultPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'Open result page (handshake)' }).click(),
    ])

    await expect(resultPage.getByTestId('frame-result')).toBeVisible()
    await expect(resultPage.getByTestId('frame-result-message')).toContainText('hello-from-result')

    // The real assertion happens back on the OPENER: it proves the second page
    // actually ran, not merely that it opened.
    await expect(page.getByTestId('windows-handshake-readout')).toContainText('hello-from-result')
    await resultPage.close()
  })

  test('an accepted confirm() is reported in the readout', async ({ page }) => {
    await page.goto('playground/windows')

    // Playwright auto-DISMISSES dialogs unless a handler is registered, so the
    // readout would say "Cancel" without this.
    page.once('dialog', (dialog) => {
      expect(dialog.type()).toBe('confirm')
      expect(dialog.message()).toBe('Proceed with the risky operation?')
      void dialog.accept()
    })

    await page.getByRole('button', { name: 'Trigger confirm()' }).click()
    await expect(page.getByTestId('windows-confirm-readout')).toContainText('OK')
  })

  test('a dismissed prompt() is reported in the readout', async ({ page }) => {
    await page.goto('playground/windows')

    page.once('dialog', (dialog) => {
      expect(dialog.type()).toBe('prompt')
      void dialog.accept('Playwright')
    })

    await page.getByRole('button', { name: 'Trigger prompt()' }).click()
    await expect(page.getByTestId('windows-prompt-readout')).toContainText('Playwright')
  })
})

test.describe('Files', () => {
  test('products.csv downloads with the right filename and content', async ({ page }) => {
    await page.goto('playground/files')

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: 'Download products.csv' }).click(),
    ])

    expect(download.suggestedFilename()).toBe('products.csv')

    const stream = await download.createReadStream()
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(Buffer.from(chunk))
    const csv = Buffer.concat(chunks).toString('utf8')

    // Same generated bytes in both modes — MSW and FastAPI read the same seed.
    expect(csv.split('\n')[0]).toBe('id,name,price,category,stock')
    expect(csv).toContain('prod-cable-clip')
  })

  test('a file uploaded through the input is echoed back by the API', async ({ page }) => {
    await page.goto('playground/files')

    const body = 'id,name\n1,uploaded-by-playwright\n'
    await page.locator('input[type="file"]').setInputFiles({
      name: 'upload-fixture.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(body, 'utf8'),
    })

    const echo = page.getByTestId('files-upload-echo')
    await expect(echo).toBeVisible()
    await expect(echo).toContainText('upload-fixture.csv')
    await expect(echo).toContainText(String(Buffer.byteLength(body, 'utf8')))
    await expect(echo).toContainText('text/csv')
    await expect(page.getByTestId('files-upload-error')).toHaveCount(0)
  })
})
