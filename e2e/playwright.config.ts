import { defineConfig, devices } from '@playwright/test'

/**
 * Two projects, ONE set of specs.
 *
 * `browser-mode` drives the exact artifact that ships to GitHub Pages (built with
 * VITE_FORCE_BROWSER_MODE=true and served by `vite preview` under the Pages base
 * path). `backend-mode` drives the Vite dev server against the real FastAPI
 * process on :8000. Every spec that runs in both projects is a parity gate: the
 * in-browser engine and the Python backend must behave identically.
 *
 * Specs stay mode-agnostic by using RELATIVE URLs (`page.goto('shop/catalog')`).
 * Playwright resolves those with `new URL(path, baseURL)`, so the Pages base path
 * is applied automatically in browser-mode. A leading slash would escape it.
 */

const PAGES_BASE = '/the-test-automation-website/'
const PREVIEW_URL = `http://localhost:4173${PAGES_BASE}`
const DEV_URL = 'http://localhost:5173/'
const BACKEND_HEALTH_URL = 'http://localhost:8000/api/health'

// `webServer` is global in Playwright, but starting FastAPI for a browser-mode-only
// run (or building the Pages bundle for a backend-mode-only run) is pure waste — and
// browser-mode must stay runnable without Python at all. So the server list is
// derived from the --project filter on the command line.
const argv = process.argv.join(' ')
const filtered = argv.includes('--project')
const runsBrowserMode = !filtered || argv.includes('browser-mode')
const runsBackendMode = !filtered || argv.includes('backend-mode')

const reuseExistingServer = !process.env.CI

const previewServer = {
  command: 'npm run build:pages && npm run preview -w frontend -- --port 4173 --strictPort',
  cwd: '..',
  // vite.config.ts reads VITE_BASE; `build:pages` sets it for the build, this sets
  // it for the preview server so both agree on the Pages base path.
  env: { VITE_BASE: PAGES_BASE },
  url: PREVIEW_URL,
  reuseExistingServer,
  timeout: 180_000,
  stdout: 'pipe' as const,
}

const backendServer = {
  // uv is on PATH in CI (astral-sh/setup-uv) but installed under ~/.local/bin and
  // NOT on PATH in a plain local shell — resolve it either way.
  command:
    'sh -c \'UV="$(command -v uv || echo "$HOME/.local/bin/uv")"; exec "$UV" run uvicorn app.main:app --port 8000\'',
  cwd: '../backend',
  url: BACKEND_HEALTH_URL,
  reuseExistingServer,
  timeout: 120_000,
  stdout: 'pipe' as const,
}

const devServer = {
  command: 'npm run dev -w frontend',
  cwd: '..',
  url: DEV_URL,
  reuseExistingServer,
  timeout: 120_000,
  stdout: 'pipe' as const,
}

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  // Spec FILES run in parallel; tests inside a file stay sequential. Backend mode
  // shares one FastAPI process across workers, so the specs that mutate a seeded
  // account's data (checkout.spec.ts) must not race themselves.
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  outputDir: 'test-results',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'browser-mode',
      use: { ...devices['Desktop Chrome'], baseURL: PREVIEW_URL },
    },
    {
      name: 'backend-mode',
      use: { ...devices['Desktop Chrome'], baseURL: DEV_URL },
    },
  ],
  webServer: [
    ...(runsBrowserMode ? [previewServer] : []),
    ...(runsBackendMode ? [backendServer, devServer] : []),
  ],
})
