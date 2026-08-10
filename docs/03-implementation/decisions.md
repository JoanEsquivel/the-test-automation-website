# Stage 3 — Implementation Decisions

> Decisions taken **while writing the code**, not before it. The up-front architectural choices
> (React + Vite, FastAPI without a database, MSW for the frontend-only mode, ATDD as the working
> method) are recorded in [`../01-exploration/notes.md`](../01-exploration/notes.md) and are not
> repeated here. What follows is what changed, what got discovered, and what the tests forced.
>
> Format per entry: **Context → Decision → Consequences.**

---

## ADR-01 — Parity is enforced by three artifacts, not by discipline

**Context.** Two independent implementations of the same REST API exist: `backend/app/routers/*.py`
(FastAPI) and `frontend/src/engine/*.ts` (TypeScript, driven by MSW). Nothing in a type system
connects them. "Keep them in sync" is not a strategy; the second implementation always drifts.

**Decision.** Parity rests on three concrete artifacts, each doing one job:

| Artifact | Guarantees |
|---|---|
| [`../02-specs/api-contract.md`](../02-specs/api-contract.md) | Normative shapes, status codes, error codes, totals math, payment and transition rules. Both implementations are written against it, neither against the other. |
| `shared/seed/*.json` | Identical data. FastAPI reads the JSON at startup; Vite bundles it through the `@seed` alias. Deterministic IDs (`prod-cable-clip`, `user-customer`) so specs can name records. |
| `e2e/tests/*.spec.ts` run twice | The executable gate. The same specs run under the `browser-mode` and `backend-mode` Playwright projects; a spec that is green in one and red in the other is a divergence in the app. |

The engine modules carry a header comment naming the Python file they mirror
(`/** Engine admin — mirrors backend/app/routers/admin.py behavior 1:1. */`), so a reviewer editing
one knows immediately that a twin exists.

**Consequences.** Adding an endpoint is a four-file change (contract, router, engine module, MSW
handler) plus tests on both sides. That cost is real and deliberate: it is what keeps the deployed
GitHub Pages site honest. CI runs both e2e projects unconditionally (`if: ${{ !cancelled() }}` on the
second step) so a failure in one never hides the result of the other.

---

## ADR-02 — Browser-mode JWTs are fake-signed, and say so

**Context.** Backend mode issues real HS256 tokens via PyJWT. Browser mode has no secret it could
keep and no way to verify a signature that any page script could also forge. Two easy exits existed:
drop auth in browser mode, or ship a "signing key" in the bundle and pretend.

**Decision.** `frontend/src/engine/token.ts` mints tokens with the **same three-segment structure and
the same claims** as the backend (`sub`, `role`, `name`, `exp` at 24 h), base64url-encoded, with a
constant literal third segment:

```ts
const FAKE_SIGNATURE = 'taw-browser-mode-simulated-signature'
```

Validation is decode-plus-expiry-check only. Bad structure → 401 `UNAUTHORIZED`, expired → 401
`TOKEN_EXPIRED`, exactly like the FastAPI dependency. The UI carries a banner explaining that
browser-mode tokens are simulated.

**Consequences.** Client code, the header format, the role guard and every auth-related spec are
identical in both modes, which is the point. A learner can paste a browser-mode token into jwt.io and
read real claims out of it — the teaching value survives. What they cannot do is treat browser mode
as a security exercise, and the banner says so rather than letting them find out. The alternative,
shipping a symmetric key so the signature "verifies", would have been a lie with extra steps.

---

## ADR-03 — All domain logic in `src/engine/`, MSW handlers stay thin

**Context.** The obvious way to build an MSW mock is to put the logic in the handlers. That logic
then can only be exercised through a service worker, in a browser, over HTTP.

**Decision.** `frontend/src/engine/` is pure TypeScript with no React and no MSW imports: 1,089 lines
across thirteen modules. `frontend/src/mocks/handlers.ts` (242 lines) parses the request, calls one
engine function, and wraps the result:

```ts
async function run<T>(fn: () => T, status = 200): Promise<Response> {
  await latency()
  try {
    const result = fn()
    if (result === undefined) return new HttpResponse(null, { status: 204 })
    return HttpResponse.json(result as object, { status })
  } catch (error) {
    return errorResponse(error)
  }
}
```

Engine functions throw `EngineError { status, code, message }`; the single `errorResponse` helper
turns that into the contract's error envelope, so no handler ever writes an error body by hand.

**Consequences.** 99 of the 218 frontend tests are plain unit tests calling engine functions directly
— no DOM, no worker, no HTTP, millisecond runtime. Totals math, coupon rules, Luhn checking, stock
guards and the order-status transition graph are all tested at that level. The component and page
tests then run the *same* handlers under `msw/node` (`frontend/src/test/shop.ts`), so they exercise
the real engine rather than a second set of stubs. Handler paths use a `*/api/...` wildcard so one
handler list serves both the dev origin and the `/the-test-automation-website/` Pages base path.

---

## ADR-04 — Locator difficulty is a hook that generates attributes, not three copies of every widget

**Context.** The playground promises three locator difficulty levels (easy / medium / evil) across
roughly forty widgets. Duplicating each widget per level would triple the surface area and guarantee
the variants drift apart.

**Decision.** One hook, `useLocatorAttrs()` in `frontend/src/playground/locators.ts`, returns an
`attrs(testId, opts)` function that spreads onto any element. The current level comes from a zustand
store; the shape of the returned object is the whole difficulty system:

| Level | Emitted attributes |
|---|---|
| easy | `data-testid`, `id`, `name`, semantic `className` |
| medium | `name` + semantic `className` only |
| evil | `id="x-<hash>"` and `className="css-<hash>"`, nothing else |

The evil seed is created once per mount via a `useState` initializer, so **every remount produces
different ids**, imitating a hashed-classname build. `withClass()` merges styling classes so
appearance never changes with the level.

**Consequences.** A widget is written once and automatically has three difficulty profiles. Adding a
widget costs one `{...attrs('thing')}` spread. Two carve-outs were necessary: the difficulty selector
itself keeps a hard-coded `data-testid="difficulty-selector"` at every level (it is the control panel,
not the challenge), and the store area never uses the hook at all — the shop has stable test ids
because it models a real application, not an exercise.

---

## ADR-05 — Shadow DOM widgets are vanilla custom elements, with state mirrored to the host

**Context.** The exploration notes already chose vanilla custom elements over React-in-shadow. What
implementation surfaced was a second problem: if the only observable state lives inside a shadow
root, then anyone whose tool cannot pierce shadow boundaries gets a page they can look at but not
assert on.

**Decision.** `frontend/src/playground/shadow/shadow-widgets.ts` defines the widgets as plain
`HTMLElement` subclasses calling `attachShadow` in `connectedCallback`. Each widget **mirrors its
outcome to a light-DOM attribute on the host** (`data-value`, `data-count`, `data-unlocked`), so
there are always two legitimate assertion routes: pierce the boundary, or read the host attribute.
Styling reuses the app's CSS custom properties, which inherit through shadow boundaries. One widget
uses `{ mode: 'closed' }` and keeps no reference to its root.

**Consequences.** Three difficulty tiers exist naturally: open root, nested open roots (one selector
must cross two boundaries), and the closed vault. The closed one is genuinely unautomatable from the
outside, and the e2e suite records that as `test.skip('a CLOSED shadow root cannot be entered — by
design')` rather than faking a pass or deleting the case. That skip is the documentation. React never
enters a shadow root, so there is no portal/event-retargeting fragility to maintain.

---

## ADR-06 — Charts are hand-written inline SVG

**Context.** The admin dashboard needs a revenue-by-category bar chart and an orders-by-status donut.
Recharts, Chart.js and friends were on the table.

**Decision.** No charting dependency. `BarChart.tsx` draws `<rect>` marks; `DonutChart.tsx` draws
stroke arcs. Both render inside a `<figure>` with `role="img"` and an `aria-label`, and both repeat
every value in an adjacent `<table>` with per-row test ids.

**Consequences.** The bundle stays small and the admin route keeps code-splitting cleanly. More
usefully for this repo: every number on the dashboard is assertable as text, so the e2e admin spec
checks tile and table content instead of trying to measure SVG geometry. Identity is never carried by
colour alone — segments get a 2 px surface gap, a labelled legend and the data table — which is why
the a11y scans pass on `/admin` without exceptions. The cost is that new chart types must be drawn by
hand; with two charts, that is cheaper than a dependency.

---

## ADR-07 — Downloads go through `fetch` + blob in both modes (a bug the e2e suite found)

**Context.** `/playground/files` originally used the plain, correct-looking thing:
`<a href={api.files.downloadUrl(name)} download={name}>`. Every unit test passed. Backend mode worked.
The Playwright download spec failed in `browser-mode`, and the saved file was `index.html`.

**Cause.** MSW's service worker deliberately ignores requests with `mode === 'navigate'`, which is
precisely what an `<a download>` click produces. The request therefore bypassed the worker entirely,
hit GitHub Pages, missed `/api/files/products.csv` as a static path, and was answered by the SPA
`404.html` fallback. The browser dutifully saved the app shell under the filename `products.csv`.

**Decision.** One code path for both modes: fetch the bytes, save them from an object URL.

```ts
async function triggerDownload() {
  const response = await fetch(url)
  const objectUrl = URL.createObjectURL(await response.blob())
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = fileName
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000)
}
```

The `<a>` keeps its real API `href` so the URL stays inspectable and copyable; the click is
intercepted. Revocation is deferred because revoking synchronously can cancel the save.

**Consequences.** `download.suggestedFilename()` and the file contents are identical in both modes,
which is what the parity gate demands. This is the clearest argument in the repo for the e2e layer
existing at all: no unit test, in any framework, could have caught it — the defect lived in the
interaction between a service worker's request filter, an HTML attribute, and a static host's 404
behaviour.

---

## ADR-08 — `PAGE_SIZE` on the admin products table: 8 → 12

**Context.** `AdminProductsPage` shipped with `PAGE_SIZE = 8`. Its ATDD spec waits for
`admin-product-row-prod-aurora-headphones` on first render, and that wait timed out.

**Cause.** Both admin implementations sort the product list newest-first
(`products.sort((a, b) => b.createdAt.localeCompare(a.createdAt))`). `prod-aurora-headphones` has
`createdAt: 2026-05-12`, which puts it at **position 10 of 24** — page 2 at eight rows per page. The
test was asserting on data that was correctly not rendered.

**Decision.** `PAGE_SIZE = 12`, matching the catalog's page size and the contract's default
`pageSize=12`. The test keeps naming a specific product rather than "the first row", because naming
a seeded record is a stronger assertion than trusting an index.

**Consequences.** One page-size constant across catalog, admin table and API default — one less
number to remember. The wider lesson is recorded here on purpose: a seeded fixture only makes a test
deterministic if the spec accounts for the **ordering** applied on top of the seed. Verify with:

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8000/api/admin/products?page=1&pageSize=24' \
  | python3 -c 'import sys,json;[print(i,p["id"],p["createdAt"]) for i,p in enumerate(json.load(sys.stdin)["items"],1)]'
# 9 prod-hub-ultra        2026-05-19T10:00:00Z
# 10 prod-aurora-headphones 2026-05-12T10:00:00Z   <- page 2 at PAGE_SIZE 8
```

---

## ADR-09 — Mode-agnostic specs: relative URLs plus one fixture

**Context.** The two Playwright projects run at different base URLs: `http://localhost:4173/the-test-automation-website/`
(the real Pages artifact under `vite preview`) and `http://localhost:5173/` (Vite dev against
FastAPI). A single spec file has to work in both without knowing which it is in.

**Decision.** Two rules. First, specs only ever use **relative** paths — `page.goto('shop/catalog')`
— because Playwright resolves them with `new URL(path, baseURL)`, so the Pages sub-path is applied
automatically; a leading slash would escape it. Second, the only mode-specific setup lives in
`e2e/fixtures.ts`, which overrides the `page` fixture to seed `localStorage['taw:apiMode'] =
'backend'` through `addInitScript` **before** `main.tsx` runs `resolveMode()`. Browser mode needs
nothing, since the Pages bundle is built with `VITE_FORCE_BROWSER_MODE=true`.

**Consequences.** No spec contains an `if (mode === …)` branch, which is what makes "the same spec
run twice" a meaningful statement. The init script has to run before first render, not in a
`beforeEach` — otherwise the app would probe the backend, decide on browser mode, and register the
MSW service worker, and the test would be running against the wrong API.

---

## ADR-10 — The `webServer` list is derived from `--project`

**Context.** Playwright's `webServer` config is global. Declaring all three servers (Vite preview of
the Pages build, FastAPI, Vite dev) means a browser-mode-only run boots Python it never touches, and
a backend-mode-only run waits through a full production build.

**Decision.** `playwright.config.ts` reads `process.argv` and includes servers conditionally:

```ts
const filtered = argv.includes('--project')
const runsBrowserMode = !filtered || argv.includes('browser-mode')
const runsBackendMode = !filtered || argv.includes('backend-mode')
```

The FastAPI command resolves `uv` either from `PATH` (CI, via `astral-sh/setup-uv`) or from
`$HOME/.local/bin/uv` (a normal local shell, where it is not on `PATH`).

**Consequences.** `npm run test:browser -w e2e` runs with **no Python installed at all**, which keeps
the frontend-only story true for contributors as well as for the deployed site. CI runs the projects
as two separate steps, each with its own `PLAYWRIGHT_HTML_OUTPUT_DIR`, so the uploaded artifact holds
both reports side by side.

---

## ADR-11 — Backend mode has shared mutable state, so the e2e suite is written for it

**Context.** FastAPI keeps everything in process memory. Playwright workers share that one process,
`backend-mode` and repeated local runs share it too, and nothing resets between tests. Browser mode
has the opposite property: every test gets a fresh `localStorage`. Specs must be correct under both.

**Decision.** Three concrete measures:

- `fullyParallel: false` — spec files run in parallel, tests inside a file stay sequential, so
  `checkout.spec.ts` cannot race itself over the same seeded account.
- The checkout fixture is `prod-cable-clip`: 500 units in stock, so repeated runs can never exhaust
  it, and $0.99, which is under the $50 free-shipping threshold, so flat shipping and 8 % tax are
  both exercised on every run.
- `ensureEmptyCustomerCart()` runs in `beforeEach` instead of assuming an empty cart.

**Consequences.** The suite is re-runnable locally without restarting uvicorn. Expected totals are
recomputed independently in `e2e/support/constants.ts` (`expectedTotals()`), so the assertion is a
real check against the normative rules rather than an echo of whatever the UI rendered.

---

## ADR-12 — The a11y gate is scoped: real pages in, anti-pattern widgets out

**Context.** Half the playground exists to provide bad markup on purpose — div-as-button, unlabelled
inputs, colour-only state. An axe scan over the whole app would fail on the product itself.

**Decision.** `e2e/tests/accessibility.spec.ts` scans six routes a visitor actually uses to get
something done: home, playground hub, shop intro, catalog, cart, login. Playground **category** pages
are excluded; the playground **hub** is included, because it is ordinary navigation. The threshold is
zero violations at `serious` or `critical`; `moderate` and `minor` are printed in the failure message
but do not block.

**Consequences.** The gate found a real defect on its first run: the toast region carried an
`aria-label` on a bare `<div>`, which axe reports as serious. It now uses `role="status"` with
`aria-live="polite"` — an implicit live region that, unlike a bare div, is allowed to be labelled.
The excluded pages are excluded by an explicit list with a comment, not by a wildcard, so widening
the scope later is a one-line change.

---

## ADR-13 — Versioned localStorage keys and a real reset

**Context.** Browser mode persists everything under `localStorage`. Shipping a schema change to
GitHub Pages would meet the previous release's data still sitting in returning users' browsers.

**Decision.** Every key is prefixed `taw:engine:v1:` from a single `ENGINE_VERSION` constant in
`frontend/src/engine/store.ts`. Bumping it invalidates all stale state at once. `resetAll()` wipes and
reseeds from `@seed/*.json`, and is wired to the "Reset demo data" button on `/shop` (behind a
confirm dialog) and reused by the Vitest setup helper `resetClientState()`.

**Consequences.** One escape hatch serves three audiences: a visitor whose data got weird, a
contributor whose tests left residue, and a future release with an incompatible shape. `taw:apiMode`
sits deliberately outside the versioned prefix — a mode preference should survive an engine reset.

---

## ADR-14 — CI builds the Pages artifact on every pull request

**Context.** The Pages build differs from the normal build in ways that only fail at deploy time:
forced browser mode, a `/the-test-automation-website/` base path, the service worker file, the
`404.html` fallback. `deploy-pages.yml` only runs on `main`.

**Decision.** A `pages-build` job in `ci.yml` mirrors the deploy build step for step and then asserts
the artifact's contents:

```bash
test -f frontend/dist/index.html
test -f frontend/dist/404.html
test -f frontend/dist/mockServiceWorker.js
test -f frontend/dist/.nojekyll
grep -q '/the-test-automation-website/assets/' frontend/dist/index.html
```

**Consequences.** A change that breaks the deployment fails on the pull request. The `browser-mode`
e2e project then runs against that same artifact under `vite preview`, so what the e2e suite tests is
what ships — not an approximation of it.

---

## ADR-15 — Simulated latency, dialled down under test

**Context.** An in-browser API answers instantly. Loading skeletons never appear, optimistic updates
are invisible, and every race condition in a test suite stays hidden until someone runs against the
real backend.

**Decision.** MSW handlers await 150–400 ms of jitter, except under Vitest:

```ts
await delay(import.meta.env.MODE === 'test' ? 1 : 150 + Math.random() * 250)
```

**Consequences.** The deployed site behaves like a network, which is the whole point of a practice
target: skeletons render, spinners resolve, and a test that forgets to wait fails. The unit suite
still finishes in about five seconds. The trade-off is that page-level Vitest tests need generous
`findBy*` timeouts (4 s) because 1 ms per request is not 0 ms.

---

## ADR-16 — Dependency versions drifted ahead of the exploration notes

**Context.** `01-exploration/notes.md` names React 18. The repo ships React 19.2, Vite 8, Vitest 4,
TypeScript 6 and react-router 7. `backend/pyproject.toml` requires Python ≥ 3.12; the resolved
`.venv` is Python 3.14.

**Decision.** Leave the exploration notes as written and record the drift here. Stage 1 is a
historical document about what was decided at the time; rewriting it to match today's lockfile would
destroy its only value.

**Consequences.** Anyone reading the notes will meet a version number that does not match
`package.json`. This entry is the reconciliation. Nothing in the implementation depends on React 18
semantics — the code was written against 19 from the first commit.

---

## ADR-17 — Uploads and downloads are a real API in both modes

**Context.** File download and upload are among the most-requested automation exercises and among the
easiest to fake. A static `<a href="/some.csv">` would have satisfied the letter of the requirement.

**Decision.** `/api/files/*` is a genuine contract endpoint with two implementations.
`frontend/src/engine/files.ts` is the twin of `backend/app/routers/files.py`: it generates the CSV
live from the current product list with RFC-4180-ish quoting, hand-builds a minimal valid PDF
(ASCII-only, so string offsets equal byte offsets), and rejects uploads over 1 MB with 400
`VALIDATION_ERROR`. MSW streams the bytes with an `attachment` `Content-Disposition`; FastAPI sets
`expose_headers: Content-Disposition` in CORS so JS can read the filename cross-origin.

**Consequences.** The CSV reflects admin edits, so "create a product, then export and assert it is in
the file" is a working exercise rather than a static fixture. Downloads work on GitHub Pages, where
there is no server — which is unusual for a practice site and is the direct reason ADR-07 exists.
