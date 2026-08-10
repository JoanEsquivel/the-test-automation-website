# The Test Automation Website (TAW)

[![CI](https://github.com/JoanEsquivel/the-test-automation-website/actions/workflows/ci.yml/badge.svg)](https://github.com/JoanEsquivel/the-test-automation-website/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/JoanEsquivel/the-test-automation-website/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/JoanEsquivel/the-test-automation-website/actions/workflows/deploy-pages.yml)

A practice application for web and API test automation, built to be automated with any tool:
Selenium, Playwright, Cypress, WebdriverIO, Postman, RestAssured, `requests`. It has two halves — a
playground of UI widgets in legacy and modern variants with deliberate automation traps, and a
working ecommerce app that composes those widgets into a real flow with a real REST API. The same
application runs in two modes: full-stack against FastAPI on your machine, or frontend-only in the
browser, which is what the GitHub Pages deploy serves.

**Live site:** <https://joanesquivel.github.io/the-test-automation-website/> (frontend-only; run
locally for API testing)

## What is in it

**Components Playground** (`/playground`) — forms, dropdowns, date pickers, tables, modals and
navigation, each in several implementations with exactly one marked as **Recommended**. Plus the
challenges: delayed and stale elements, spinners, auto-dismissing toasts, infinite scroll, single and
nested iframes, open / nested / closed shadow roots, new-tab handshakes, native dialogs, downloads and
uploads, HTML5 drag & drop, sliders, canvas, context menus, press-and-hold. Every page explains what
it is and how to automate it, and a difficulty selector switches every widget between three locator
strategies:

| Level | What the widgets expose |
|---|---|
| easy | `data-testid`, `id`, `name`, semantic classes |
| medium | semantic class + `name` only |
| evil | random per-mount `id` and obfuscated class, nothing else |

**TAW Store** (`/shop`) — catalog with search, filters, sorting and pagination; product detail with
reviews and a live average; wishlist; guest cart that merges into your account on login; coupons; a
3-step checkout with simulated payment; order history with a status timeline; profile and address
book; and a role-guarded admin dashboard with stats, product CRUD and order status transitions.

**Dual mode** — one typed client, one REST contract, two servers behind it. UI code never branches on
mode; it always issues real `fetch()` calls to `/api/*`.

| | Backend mode | Browser mode |
|---|---|---|
| API served by | FastAPI at `http://localhost:8000/api` | MSW service worker → TypeScript engine in the page |
| Data resets | on server restart | "Reset demo data" button (localStorage) |
| Network tab | real cross-origin HTTP + CORS | same-origin, answered by the worker |
| Postman / RestAssured | yes, with OpenAPI docs at `/docs` | no — nothing leaves the page |
| Where | local development | GitHub Pages, and as automatic fallback |

## Quickstart

Prerequisites: **Node 22+**, and for the backend **Python 3.12+** with
[`uv`](https://docs.astral.sh/uv/). If you installed `uv` with the official script it lives at
`~/.local/bin/uv` and may not be on your `PATH`.

```bash
git clone https://github.com/JoanEsquivel/the-test-automation-website.git
cd the-test-automation-website
npm install          # installs the root, frontend and e2e workspaces
```

**Frontend only** — no Python, no backend:

```bash
npm run dev          # http://localhost:5173
```

On first load the app probes `http://localhost:8000/api/health` with a 1.5 s timeout. Nothing
answers, so it boots in browser mode and the service worker serves the API. Everything works: auth,
cart, checkout, admin, even file downloads.

**Full stack** — two terminals:

```bash
npm run dev:backend   # terminal 1 → FastAPI on http://localhost:8000
npm run dev           # terminal 2 → Vite on http://localhost:5173
```

Then flip the toggle in the header (`data-testid="api-mode-toggle"`) to **BACKEND**. The choice is
stored in `localStorage['taw:apiMode']` and the page reloads so the bootstrap re-runs cleanly. The
pill next to it (`data-testid="api-mode-indicator"`) reads `BACKEND :8000` or `IN-BROWSER`, so a test
can assert which API it is talking to.

If you come back later with the backend stopped, the health check fails and the app **falls back to
browser mode** with a dismissible warning instead of showing a broken page.

## Test credentials and fixtures

All fixtures live in [`shared/seed/`](shared/seed/) and are loaded by both implementations, so IDs
and values are identical in either mode.

**Users**

| Email | Password | Role | Notes |
|---|---|---|---|
| `customer@example.com` | `Password123!` | customer | Casey Customer, two saved addresses |
| `admin@example.com` | `Admin123!` | admin | Alex Admin, unlocks `/admin` |

**Payment cards** (checkout, step 2)

| Card | Result |
|---|---|
| `4111 1111 1111 1111` | order placed, status `paid` |
| any card ending `0000` | 400 `PAYMENT_DECLINED`, wizard returns to the payment step |
| any other Luhn-valid number | succeeds |
| a number failing the Luhn check | 400 `VALIDATION_ERROR` |

**Coupons**

| Code | Expected outcome |
|---|---|
| `WELCOME10` | applies, 10 % off the subtotal |
| `SAVE20` | $20 off, but only at a subtotal ≥ $100 — below that, 400 `COUPON_MIN_SUBTOTAL` |
| `EXPIRED50` | 400 `COUPON_EXPIRED` |
| `DISABLED5` | 400 `COUPON_INVALID` (inactive) |
| anything else | 400 `COUPON_INVALID` |

**Money rules** (identical in both modes): shipping is free at subtotal − discount ≥ $50, otherwise
$4.99; tax is 8 % of subtotal − discount; order numbers are sequential `TAW-2026-NNNN`.

Catalog: 24 products across 5 categories, 40 reviews. Deliberate edge cases include a product with a
very long name (`prod-trail-watch`), an out-of-stock product (`prod-studio-mic`), a $0.99 item
(`prod-cable-clip`) and a $1,299 one (`prod-quantum-headset`).

## API testing

Start the backend and you get a real HTTP API with interactive OpenAPI docs:

- Swagger UI: <http://localhost:8000/docs>
- Schema: <http://localhost:8000/openapi.json>
- **Normative contract:** [`docs/02-specs/api-contract.md`](docs/02-specs/api-contract.md) — the
  single source of truth for every path, status code, error code and calculation. FastAPI and the
  in-browser engine are both written against it.

Conventions: JSON, camelCase, `Authorization: Bearer <JWT>` (HS256, claims `sub`/`role`/`name`/`exp`),
guest carts identified by an `X-Cart-Id` header, and one error envelope for every non-2xx response:

```json
{ "error": { "code": "INVALID_CREDENTIALS", "message": "Email or password is incorrect." } }
```

Three requests to get productive:

```bash
# 1. is it up?
curl -s http://localhost:8000/api/health
# {"status":"ok","mode":"backend","version":"1.0.0"}

# 2. log in and keep the token
curl -s -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"customer@example.com","password":"Password123!"}'
# {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","user":{"id":"user-customer",
#  "email":"customer@example.com","name":"Casey Customer","role":"customer","addresses":[...]}}

# 3. list products — search, category, sort, page, pageSize (default 12, max 48)
curl -s 'http://localhost:8000/api/products?category=audio&sort=price-asc&pageSize=2'
# {"items":[{"id":"prod-pulse-earbuds","name":"Pulse True Wireless Earbuds","price":89.5,
#   "category":"audio","stock":60,"rating":3.5,...}, {...}],
#  "page":1,"pageSize":2,"total":5,"totalPages":3}
```

Error paths are just as easy to reach:

```bash
curl -s -X POST http://localhost:8000/api/coupons/validate \
  -H 'Content-Type: application/json' -d '{"code":"SAVE20","subtotal":60}'
# 400 {"error":{"code":"COUPON_MIN_SUBTOTAL",
#      "message":"Coupon 'SAVE20' requires a subtotal of at least $100.00."}}
```

CORS allows `http://localhost:5173` and `http://localhost:4173`, and exposes `Content-Disposition` so
JavaScript can read download filenames.

> **The deployed GitHub Pages site cannot be called from Postman, RestAssured or `curl`.** In browser
> mode the API is a service worker living inside the page; there is no server and no origin to send a
> request to. API testing requires the local backend. This is stated in the app as well, on the
> `/shop` pre-screen and in the header banner.

## Running the tests

```bash
# Backend — 94 pytest acceptance tests
cd backend && uv run pytest                # or, from the root: npm run test:backend

# Frontend — 218 Vitest tests (engine units + component/page tests against MSW)
cd frontend && npx vitest --run            # bare `npm test` starts WATCH mode; pass --run
cd frontend && npx vitest --run --coverage

# End-to-end — 31 Playwright tests per project, the same specs against both APIs
npx playwright install chromium            # once
npm run test:browser -w e2e                # Pages bundle + service-worker API (no Python needed)
npm run test:backend -w e2e                # Vite dev + FastAPI on :8000
npm run e2e                                # both projects

npm run report -w e2e                      # open the last HTML report
```

Playwright starts every server it needs on its own, and the server list is derived from `--project`,
so a browser-mode run does not build the backend and a backend-mode run does not build the Pages
bundle.

Details, including what each layer deliberately does not cover, are in
[`docs/04-testing/strategy.md`](docs/04-testing/strategy.md).

## Project structure

```
.
├── frontend/                 React 19 + Vite + TypeScript + Tailwind v4
│   └── src/
│       ├── api/              typed client, mode resolution, contract types
│       ├── engine/           in-browser twin of the backend (pure TS, unit-tested)
│       ├── mocks/            MSW worker + thin handlers over the engine
│       ├── playground/       locator-difficulty hook, vanilla shadow-DOM widgets
│       ├── pages/            playground/, shop/, admin/, account/, frames/
│       ├── components/ui/    design-system primitives
│       └── stores/           zustand: auth, cart, mode
├── backend/                  FastAPI, uv-managed, no database
│   ├── app/routers/          auth · products · cart · orders · reviews · wishlist · files · admin
│   ├── app/services/         commerce rules (totals, coupons, payment)
│   ├── app/store/memory.py   in-memory stores seeded from shared/seed
│   └── tests/                94 pytest acceptance tests
├── e2e/                      Playwright: 2 projects, 1 set of specs
├── shared/seed/              products · categories · users · coupons · reviews (single source of truth)
├── docs/                     the four documented stages
└── .github/workflows/        ci.yml · deploy-pages.yml
```

## Deployment

Every push to `main` publishes the site to GitHub Pages via
[`deploy-pages.yml`](.github/workflows/deploy-pages.yml).

- **The deployed site is frontend-only.** The Pages build runs with `VITE_FORCE_BROWSER_MODE=true`,
  so the API is served in-browser by a Mock Service Worker and the mode toggle is locked with an
  explanatory tooltip. The UI, data and flows are identical, but there is no network traffic leaving
  the page to intercept or assert on.
- **Deep links work.** The build copies `index.html` to `404.html`, so Pages hands unknown paths back
  to the SPA and the router, mounted at the `/the-test-automation-website/` base path, resolves them.
- **Pull requests are gated on the Pages build.** `ci.yml` has a `pages-build` job that mirrors the
  deploy build and asserts the artifact contents, so a change that would break the deployment fails
  on the PR. The `browser-mode` e2e project then runs against that same artifact.
- **Full API testing requires the local backend** (see [API testing](#api-testing)).

## Documentation stages

Development followed four documented stages, all under [`docs/`](docs/):

1. [`01-exploration`](docs/01-exploration/notes.md) — research, gap analysis and the up-front decision log
2. [`02-specs`](docs/02-specs/) — normative specs: [API contract](docs/02-specs/api-contract.md), [data model](docs/02-specs/data-model.md), [playground catalog](docs/02-specs/playground-catalog.md), [ecommerce](docs/02-specs/ecommerce-spec.md), [dual-mode architecture](docs/02-specs/dual-mode-architecture.md)
3. [`03-implementation`](docs/03-implementation/decisions.md) — ADR-style log of what was decided while building, including the bugs the tests caught
4. [`04-testing`](docs/04-testing/strategy.md) — the ATDD loop, the test pyramid, the parity gate, and how to run everything

## Credits

Built by **Joan Esquivel** — [linkedin.com/in/joanesquivel](https://www.linkedin.com/in/joanesquivel/).
The credit is in the site footer too, on every page.

## License

Not licensed yet. No `LICENSE` file has been added, so default copyright applies: the code is public
to read and to practise against, but there is no grant of reuse rights. Open an issue if you need one.
