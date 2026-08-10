# The Test Automation Website (TAW)

[![CI](https://github.com/JoanEsquivel/the-test-automation-website/actions/workflows/ci.yml/badge.svg)](https://github.com/JoanEsquivel/the-test-automation-website/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/JoanEsquivel/the-test-automation-website/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/JoanEsquivel/the-test-automation-website/actions/workflows/deploy-pages.yml)

The definitive practice application for **web and API test automation** — built to work with any
tool on the market: Selenium, Playwright, Cypress, WebdriverIO, Postman, RestAssured, and more.

**🌐 Live site:** <https://joanesquivel.github.io/the-test-automation-website/>
(frontend-only mode — run locally for full API testing)

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

## Deployment

Every push to `main` publishes the site to GitHub Pages via
[`deploy-pages.yml`](.github/workflows/deploy-pages.yml). Three things are worth knowing before you
point a test suite at the live URL:

- **The deployed site is frontend-only.** The Pages build runs with
  `VITE_FORCE_BROWSER_MODE=true`, so the API is served in-browser by a Mock Service Worker and the
  backend/browser mode toggle is locked. The UI, data and flows are identical — but there is no
  network traffic to intercept or assert on.
- **Deep links work.** The build copies `index.html` to `404.html`, so GitHub Pages hands unknown
  paths back to the SPA and the router (mounted at the `/the-test-automation-website/` base path)
  resolves them.
- **Full API testing requires running the backend locally.** Start FastAPI with
  `npm run dev:backend` and the frontend with `npm run dev`; the app then talks real HTTP to
  `http://localhost:8000/api`, which is what you want for Postman/RestAssured-style work.

## Documentation stages

Development follows four documented stages, all under [`docs/`](docs/):

1. [`01-exploration`](docs/01-exploration/notes.md) — research and decision log
2. [`02-specs`](docs/02-specs/) — normative specs (API contract, data model, playground catalog, ecommerce, dual-mode architecture)
3. `03-implementation` — ADR-style implementation decisions
4. `04-testing` — testing strategy (ATDD, unit, e2e)
