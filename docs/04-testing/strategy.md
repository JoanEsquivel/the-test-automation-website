# Stage 4 — Testing Strategy

> This repo is a practice target for test automation, so its own test suite has to be worth copying.
> This document describes how it was built, what each layer is responsible for, what each layer is
> deliberately bad at, and how to run all of it.
>
> Counts below were produced by running the suites, not by reading the commit log.

## The numbers

| Layer | Tool | Count | Where |
|---|---|---|---|
| Backend API acceptance | pytest + `TestClient` | **94** in 8 files | `backend/tests/` |
| Engine units | Vitest, no DOM involved | **99** in 9 files | `frontend/src/engine/__tests__/` |
| Mode resolution units | Vitest | **6** in 1 file | `frontend/src/api/__tests__/mode.test.ts` |
| Component & page | Vitest + Testing Library + `msw/node` | **113** in 28 files | `frontend/src/{pages,components,playground}/**/__tests__/` |
| End-to-end | Playwright, 2 projects | **31 per project** (62 declared, 60 run, 2 skipped by design) | `e2e/tests/` |
| Accessibility | axe-core inside Playwright | 6 routes × 2 projects | `e2e/tests/accessibility.spec.ts` |

Frontend total: **218 tests in 38 files**. Everything above runs in CI on every push and pull
request ([`ci.yml`](../../.github/workflows/ci.yml)).

---

## The ATDD loop, as actually practised

Every implementation phase followed the same four beats, and each phase is exactly one commit whose
body records the numbers:

1. Read the relevant spec in [`../02-specs/`](../02-specs/).
2. Write the acceptance tests from it and **watch them fail**. A test that has never been red has not
   been shown to test anything.
3. Implement until green.
4. Commit with the red count and the green count in the message.

| Commit | Phase | Red at start | Green at end |
|---|---|---|---|
| `d5fce44` | Backend auth + catalog | 24 failing | 32 passing |
| `dd4efb2` | Backend commerce (cart, coupons, orders, reviews, wishlist, files, admin) | 59 failing | 94 passing |
| `338614b` | Frontend foundation (design system, layouts, router, home) | 4 failing | 6 passing |
| `0223dc9` | Dual-mode API layer (client, mode resolution, engine, MSW) | engine + mode specs first | 30 passing |
| `e82938e` | Playground component variants + locator difficulty | 9 new files red | 69 passing |
| `f587ab2` | Playground challenges (dynamic, structural, interaction) | 8 files red | 102 passing |
| `bd4dd0e` | Store: catalog → checkout → orders | engine + page specs first | 176 passing |
| `b819d9c` | Profile, address book, admin dashboard | tests first | 218 passing |
| `4909c0c` | Playwright suite across both modes | — | 30 passing per mode, 1 skipped |

Two points worth stealing. First, the **backend counts jump 32 → 94 in one phase** because the specs
were detailed enough to write 59 acceptance tests before any router existed. Writing tests from a
normative contract rather than from code is what makes that possible. Second, the frontend counts are
cumulative and the suite was never allowed to go red between phases — a phase's own tests go red, the
previous phases' do not.

---

## What each layer owns

### pytest — the backend API contract (94)

Owns everything reachable over HTTP from FastAPI, asserted at the level of status codes, error codes
and JSON bodies. Uses `TestClient` with a store reset per test (`backend/tests/conftest.py`).

| File | Tests | Focus |
|---|---|---|
| `test_cart.py` | 20 | Guest identity via `X-Cart-Id`, stock guards, totals math, guest→user merge |
| `test_products.py` | 16 | Search, category filter, six sort orders, pagination bounds, 404s |
| `test_auth.py` | 15 | Register/login/me, password rules, `EMAIL_TAKEN`, address book, default-address invariant |
| `test_admin.py` | 14 | Role guard (401 vs 403), product CRUD, status transition graph, stats math |
| `test_orders.py` | 12 | Luhn validation, `PAYMENT_DECLINED`, order numbering, stock decrement, ownership |
| `test_reviews_wishlist.py` | 12 | Review posting, live rating recompute, `ALREADY_IN_WISHLIST` |
| `test_files.py` | 4 | CSV contents, PDF magic bytes, 1 MB upload cap |
| `test_health.py` | 1 | Liveness shape |

Does **not** own: anything about the browser. No rendering, no service worker, no CORS behaviour as
experienced by a real page.

### Vitest — engine units (99)

Pure function calls into `frontend/src/engine/*`. No DOM, no HTTP, no worker. This is where the
in-browser twin of every backend rule is pinned down: totals math (`commerce.test.ts`, 14), the admin
role guard and transition graph (`admin.test.ts`, 22), cart stock rules (`cart.test.ts`, 19), payment
simulation and order numbering (`orders.test.ts`, 11), sort and pagination (`catalog.test.ts`, 10).

These are the fastest tests in the repo and they carry the most logic. If a rule can be expressed as
"given this input, the API returns this output", it belongs here and in pytest, not in a page test.

### Vitest + Testing Library — component and page tests (113)

Render a route into jsdom with `MemoryRouter`, run the **real MSW handlers** under `msw/node`
(`frontend/src/test/shop.ts`), reset client state between tests, and drive the UI with `user-event`.
Because the handlers call the real engine, these tests exercise the true request/response path rather
than a second set of stubs.

Owns: form validation and inline errors, loading and empty states, optimistic cart updates, route
guards (`RequireAuth`, `RequireAdmin`), toast behaviour, difficulty-level attribute switching,
pagination and URL-mirrored state.

Deliberately does **not** own — jsdom cannot do these things, so attempting them would produce tests
that pass while the feature is broken:

| Not covered here | Why | Covered by |
|---|---|---|
| iframes | jsdom does not load or execute framed documents | `playground-structural.spec.ts` |
| Real shadow-root piercing | jsdom's shadow support does not match a browser's, and closed roots are meaningless without one | `playground-structural.spec.ts` |
| New tabs / `window.open` handshake | no window management | `playground-structural.spec.ts` |
| Downloads | no download manager, no `Content-Disposition` handling — **and this is exactly where the bug in [ADR-07](../03-implementation/decisions.md#adr-07--downloads-go-through-fetch--blob-in-both-modes-a-bug-the-e2e-suite-found) hid** | `playground-structural.spec.ts` |
| File upload through a real input | partial at best | `playground-structural.spec.ts` |
| HTML5 drag & drop, pointer gestures, press-and-hold | no real pointer/drag event model | `playground-interaction.spec.ts` |
| Scroll-driven behaviour (infinite scroll, `IntersectionObserver`) | no layout, no viewport | `playground-interaction.spec.ts` |
| Native `alert`/`confirm`/`prompt` | stubbed, not real | `playground-structural.spec.ts` |
| Service worker behaviour | `msw/node` intercepts in-process; it is not a worker | `browser-mode` project |
| Accessibility of rendered output | axe needs real layout and computed styles | `accessibility.spec.ts` |

### Playwright — end-to-end, twice (31 per project)

| Spec | Tests | Focus |
|---|---|---|
| `playground-structural.spec.ts` | 10 | Iframes (single + nested), open/nested/closed shadow roots, new-tab handshake, native dialogs, download, upload |
| `playground-interaction.spec.ts` | 7 | Drag & drop, sortable list, native + ARIA sliders, press-and-hold, double-click, infinite scroll |
| `accessibility.spec.ts` | 6 | axe scan per route, zero `serious`/`critical` |
| `admin.spec.ts` | 3 | Admin dashboard, customer 403, anonymous redirect with `returnTo` |
| `mode.spec.ts` | 3 | Mode pill, toggle state, forced-mode banner |
| `checkout.spec.ts` | 2 | The parity gate (see below) |

One test is `test.skip`ped in both projects: `a CLOSED shadow root cannot be entered — by design`.
That is not a gap, it is a recorded fact about the platform. Faking a pass there would teach the
wrong thing.

---

## The parity gate

`browser-mode` and `backend-mode` are two Playwright projects running **the same spec files** against
two independent implementations of [`api-contract.md`](../02-specs/api-contract.md):

| | `browser-mode` | `backend-mode` |
|---|---|---|
| Served by | `vite preview` of the real GitHub Pages bundle at `/the-test-automation-website/` | Vite dev server at `/` |
| API | MSW service worker → `frontend/src/engine/` | FastAPI on `:8000` over real cross-origin HTTP |
| Mode set by | `VITE_FORCE_BROWSER_MODE=true` at build time | `addInitScript` seeding `localStorage['taw:apiMode']` before first render |

`checkout.spec.ts` carries the load: home → store pre-screen → catalog → add to cart → cart totals →
login (guest cart merges) → 3-step checkout → confirmation → order history, plus a declined-card run
that must return to the payment step. Expected totals are recomputed independently by
`expectedTotals()` in `e2e/support/constants.ts` from the normative rules ($50 free-shipping
threshold, $4.99 flat shipping, 8 % tax), so the assertions are a check rather than an echo of the UI.

**If this file passes in one project and fails in the other, the application is wrong.** CI runs both
projects as separate steps with `if: ${{ !cancelled() }}` on the second, so a failure in one never
hides the other's result, and both HTML reports are uploaded as one artifact.

---

## Running everything

Prerequisites: Node 22+, Python 3.12+, and [`uv`](https://docs.astral.sh/uv/). If `uv` was installed
by the official script it lives at `~/.local/bin/uv` and may not be on your `PATH`.

```bash
npm install          # root + frontend + e2e workspaces
```

### Backend (94 tests, ~1 s)

```bash
cd backend && uv run pytest          # or: npm run test:backend
uv run pytest -v                      # per-test names
uv run pytest tests/test_cart.py -k merge
```

### Frontend (218 tests, ~5 s)

```bash
cd frontend && npx vitest --run       # one-shot
npx vitest                            # watch mode — this is what bare `npm test` does
npx vitest --run --coverage           # v8 coverage, text + html into frontend/coverage/
npx vitest --run src/engine           # engine units only
```

Note: the `test` script in `frontend/package.json` is bare `vitest`, which **watches**. Always pass
`--run` in scripts and CI. CI does this as
`npm run test --workspace=frontend --if-present -- --run`.

### End-to-end (31 tests per project)

Playwright starts every server it needs, and the server list is derived from `--project`, so a
browser-mode run needs no Python at all.

```bash
npx playwright install chromium       # once

npm run test:browser -w e2e           # Pages bundle + service-worker API
npm run test:backend -w e2e           # Vite dev + FastAPI on :8000
npm run e2e                           # both projects, 62 tests
```

Useful while writing specs:

```bash
cd e2e
npx playwright test --list                        # what would run, per project
npx playwright test --project=backend-mode --headed --debug
npx playwright test checkout --project=browser-mode
npm run report -w e2e                             # open the last HTML report
```

### Lint and build

```bash
cd frontend && npx oxlint             # includes the jsx-a11y rules
npm run build                         # tsc -b && vite build
npm run build:pages                   # the exact artifact that deploys
```

## Reading the reports

- **Playwright HTML** — `e2e/playwright-report/index.html`, opened with `npm run report -w e2e`. In
  CI, download the `playwright-report` artifact from the run; it contains `browser-mode/` and
  `backend-mode/` subfolders. Compare the two: a test green in one and red in the other is a parity
  defect, and that is the first thing to look for.
- **Traces** — `trace: 'on-first-retry'`, so a flake in CI leaves a trace on the retry. Open it with
  `npx playwright show-trace <path>`. Screenshots are captured on failure; video is off.
- **axe failures** — the accessibility spec prints the rule id, the impact and the offending
  selectors in the failure message, including `moderate`/`minor` findings that did not block, so a
  failing scan tells you what to fix without re-running anything.
- **Vitest coverage** — `frontend/coverage/index.html` after `--coverage`. Current baseline: 78.4 %
  statements, 72.5 % branches, 80.4 % lines. There is no threshold configured and coverage does not
  run in CI; it is a reading tool, not a gate. `frontend/coverage/` is not in `.gitignore` yet, so
  delete it after a local run.

---

## Known gaps

Honest list, in rough order of how much a contributor would gain by closing them.

1. **No API-level contract test that runs against both implementations.** Parity is currently proven
   through the UI. A suite that fires the same request table at `localhost:8000/api` and at the
   engine, diffing status codes and bodies, would catch drift on endpoints the store's UI never
   exercises (`PATCH /api/admin/orders/{id}/status` with an illegal transition, for one).
2. **Single browser.** Everything runs on Chromium. `devices['Desktop Firefox']` and WebKit would
   cost one config change and would probably find real issues in the shadow DOM and dialog specs.
3. **No visual regression testing.** `toHaveScreenshot()` on the playground category pages would be a
   natural fit, since the widgets are static by design.
4. **No mobile viewport project.** The layout is responsive but nothing asserts it.
5. **No performance budget.** Route-level code splitting exists and was verified by eye in the build
   output; nothing fails a build if a bundle doubles.
6. **Coverage is uninstrumented for the backend.** `pytest-cov` is not installed, so there is no
   number for the Python side.
7. **The a11y gate skips the playground category pages** on purpose ([ADR-12](../03-implementation/decisions.md#adr-12--the-a11y-gate-is-scoped-real-pages-in-anti-pattern-widgets-out)).
   A finer split — scan each page but allow-list the known anti-pattern rules per widget — would give
   real coverage there instead of none.
8. **No load or contract-fuzzing layer.** Schemathesis against `/openapi.json` would be a small
   addition with a good return, since FastAPI already publishes the schema.
