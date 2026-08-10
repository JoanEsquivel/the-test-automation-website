# Stage 1 — Exploration Notes & Decision Log

> This document records the research and decisions made **before** any code was written.
> It is the first of four documented stages: exploration → spec-driven development → implementation → testing.

## Goal

Build **The Test Automation Website (TAW)** — the definitive practice application for web and API
test automation. It must work with any tool on the market (Selenium, Playwright, Cypress,
WebdriverIO, Postman, RestAssured, requests, …) and go beyond existing practice sites
(the-internet, saucedemo, automationexercise) by offering:

1. A **Components Playground**: every common UI element in *multiple implementation variants*
   (legacy vs modern, with the recommended modern implementation clearly marked), plus deliberate
   automation challenges and selectable locator-difficulty levels.
2. A **realistic Ecommerce demo** that composes those elements into a complete application:
   catalog, cart, coupons, multi-step checkout, auth, reviews, wishlist, orders, and an admin
   dashboard.
3. A **dual-mode architecture**: full-stack locally (React + FastAPI, real HTTP for API testing)
   and frontend-only on GitHub Pages (same UI, API served in-browser).

## Key decisions

| # | Decision | Alternatives considered | Rationale |
|---|----------|------------------------|-----------|
| 1 | **React 18 + Vite + TypeScript + Tailwind CSS v4** | Next.js static export; plain JS | GitHub Pages only serves static files, so Next's SSR/API routes would go unused; Vite is lighter, faster, and `base` config for Pages is trivial. TS keeps a large codebase maintainable. |
| 2 | **FastAPI backend, no database** | Express, Flask; SQLite | User requirement: no DB. FastAPI gives free OpenAPI docs (`/docs`) — valuable for API-testing learners. In-memory stores seeded from JSON restore on restart, which is *desirable* for a practice sandbox. |
| 3 | **MSW (Mock Service Worker) + TypeScript domain engine for frontend-only mode** | Degrade features on Pages; adapter layer that skips `fetch` | MSW intercepts real `fetch` calls at the network layer, so the UI code is byte-identical in both modes and network activity remains observable by test tools. An adapter that bypasses `fetch` would break network-level test practice. |
| 4 | **Shared seed JSON (`shared/seed/*.json`)** | Duplicated fixtures | Single source of truth loaded by FastAPI at startup and bundled into the frontend for the browser engine. Deterministic IDs so test scripts are stable across modes. |
| 5 | **BrowserRouter + 404.html fallback on Pages** | HashRouter | Clean URLs are better for teaching navigation/locators. The `404.html` copy trick serves deep links (status 404 but correct content) — acceptable for a practice site. HashRouter documented as a one-line fallback. |
| 6 | **Vanilla custom elements for Shadow DOM widgets** | React inside shadow roots | React portals/events inside shadow roots are fragile, and real-world shadow DOM is rarely React anyway. Includes one **closed** shadow root as the hardest case. |
| 7 | **Real HS256 JWTs in backend mode; structurally identical fake-signed JWTs in browser mode** | Session cookies; no auth in browser mode | Keeps client code identical; honest UI banner explains browser-mode tokens are simulated. |
| 8 | **npm workspaces (`frontend`, `e2e`) + independent `uv` Python project** | Turborepo/Nx; single package | Two Node packages don't justify a monorepo tool; Python never belongs in npm workspaces. |
| 9 | **zustand for client state** | Redux; Context only | Tiny API, no boilerplate; used only for auth/cart/mode state. Server data stays behind the API client. |
| 10 | **ATDD everywhere** | Test-after | Acceptance tests are written *first* from the specs in `docs/02-specs/`, watched failing, then implemented to green. This repo should model good testing practice — it is a testing tool. |
| 11 | **Cross-origin by design in local mode** (frontend :5173 → backend :8000, CORS) | Vite proxy | Learners must see the exact same requests in the browser network tab that they will send from Postman/RestAssured. A proxy would hide the real origin story. |

## Existing-site gap analysis (why this app needs to exist)

- **the-internet (Heroku)**: great element zoo, but dated UI, no realistic app flow, no API.
- **saucedemo**: nice small shop, but tiny element variety, no API, no difficulty levels.
- **automationexercise / opencart demos**: realistic shop but noisy, no deliberate challenges,
  no guidance on which implementation is "correct".
- **None** offer: locator difficulty levels, legacy-vs-modern variant comparison with a
  recommended badge, a dual-mode API story, or self-describing pages with usage instructions.

## Constraints

- All UI text and documentation in **English**.
- Every page must be **self-describing** (a `PageIntro` explains what the page does and how to use it).
- The Ecommerce path must open with an explanatory **pre-screen** (features + mode warning).
- One git commit per implementation phase, pushed to GitHub.
