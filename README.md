# The Test Automation Website (TAW)

The definitive practice application for **web and API test automation** — built to work with any
tool on the market: Selenium, Playwright, Cypress, WebdriverIO, Postman, RestAssured, and more.

> 🚧 Under construction. This README will grow with the project; the full quickstart lands in the
> documentation phase.

## What it will offer

- **Components Playground** — every common UI element in multiple implementation variants
  (legacy vs modern, with the recommended one clearly marked), deliberate automation challenges
  (dynamic content, iframes, Shadow DOM, new windows, drag & drop, …) and three locator
  difficulty levels (easy / medium / evil).
- **TAW Store** — a realistic ecommerce demo: catalog, cart, coupons, 3-step checkout, auth,
  reviews, wishlist, orders, and an admin dashboard.
- **Dual mode** — run full-stack locally (React + FastAPI, real HTTP for API testing) or use the
  frontend-only deployment on GitHub Pages (same UI, API served in-browser by a service worker).

## Documentation stages

Development follows four documented stages, all under [`docs/`](docs/):

1. [`01-exploration`](docs/01-exploration/notes.md) — research and decision log
2. [`02-specs`](docs/02-specs/) — normative specs (API contract, data model, playground catalog, ecommerce, dual-mode architecture)
3. `03-implementation` — ADR-style implementation decisions
4. `04-testing` — testing strategy (ATDD, unit, e2e)
