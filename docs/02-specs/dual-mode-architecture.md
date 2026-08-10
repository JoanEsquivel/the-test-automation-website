# Spec — Dual-Mode Architecture

> **One REST contract, one typed client, two servers.** UI code never branches on mode: it always
> calls `apiClient`, which always performs real `fetch()` requests against `/api/*` paths.

## Modes

| | **Backend mode** | **Browser mode** |
|---|---|---|
| Server | FastAPI at `http://localhost:8000/api` | MSW service worker in the page, delegating to the TypeScript domain engine |
| Persistence | Python process memory (reset on restart) | localStorage `taw:engine:v1:*` (reset button) |
| Network tab | Real cross-origin HTTP + CORS | Same-origin requests answered by the service worker |
| API testing (Postman etc.) | ✅ full — `/docs` OpenAPI | ❌ not reachable from outside the page (honest banner explains this) |
| JWT | Real HS256 signature | Structurally identical, fake signature (decode-only validation) |
| Where used | Local development / workshops | GitHub Pages deploy + automatic fallback |

## Mode resolution (in `main.tsx`, before React renders)

```
1. import.meta.env.VITE_FORCE_BROWSER_MODE === 'true'   (Pages build)
      → mode = browser; toggle disabled with tooltip; persistent info banner.
2. localStorage 'taw:apiMode' present?
      → if 'backend': GET http://localhost:8000/api/health with 1500 ms AbortController timeout;
        unreachable → mode = browser + dismissible warning banner
        ("Backend unreachable — switched to in-browser mode").
      → if 'browser': use it.
3. First visit: run the same health check; reachable → backend, else browser (no warning).
```

- Browser mode boot: `await worker.start({ serviceWorker: { url: import.meta.env.BASE_URL +
  'mockServiceWorker.js' }, onUnhandledRequest: 'bypass' })` **before** `createRoot`.
- Backend mode boot: ensure any existing MSW registration is unregistered.
- `API_BASE` = `http://localhost:8000/api` (backend) | `${BASE_URL}api`-relative (browser).

## The toggle

Header switch (`data-testid="api-mode-toggle"`) + mode pill (`data-testid="api-mode-indicator"`,
text `BACKEND :8000` or `IN-BROWSER`). Changing it writes localStorage and calls
`window.location.reload()` — a deliberate full reload so bootstrap re-runs cleanly and no mixed
worker/engine state can exist. Disabled (with explanatory tooltip) on the Pages build.

## Typed client (`frontend/src/api/client.ts`)

- Generic `request<T>(method, path, { body, auth })`; attaches `Authorization` from the auth store
  and `X-Cart-Id` from the cart store when present.
- Non-2xx → throws `ApiError { status, code, message }` parsed from the error envelope.
- All endpoint functions live in one module and are the only place URLs are written.

## Domain engine (`frontend/src/engine/`)

- Pure TypeScript, no React/MSW imports — unit-testable in isolation (Vitest).
- `store.ts`: repositories over localStorage with versioned keys; seeds from `@seed/*.json`
  (Vite alias to `shared/seed/`); `resetAll()` wipes and reseeds.
- One module per API area mirroring backend routers 1:1 (auth, catalog, cart, orders, reviews,
  coupons, wishlist, admin, files). Same validation rules and totals math as FastAPI.
- Artificial latency: 150–400 ms jitter per request so async UI behavior resembles a network.
- `token.ts`: mints fake-signed JWTs with real claim structure; validates by decoding + expiry.

## MSW layer (`frontend/src/mocks/handlers.ts`)

Thin adapters only: parse request → call engine function → wrap response/error envelope.
No business logic in handlers. `browser.ts` exports `setupWorker(...handlers)`.

## Parity enforcement

1. `api-contract.md` is normative; both implementations are reviewed against it.
2. Shared seed JSON guarantees identical data.
3. The Playwright e2e checkout spec runs against **both** modes in CI; drift fails the build.

## GitHub Pages specifics

- Build: `VITE_FORCE_BROWSER_MODE=true VITE_BASE=/the-test-automation-website/ vite build`.
- `mockServiceWorker.js` lives in `frontend/public/` → served at the base path; worker URL uses
  `BASE_URL` so scope matches the subpath.
- SPA deep links: `cp dist/index.html dist/404.html`; router uses
  `basename={import.meta.env.BASE_URL}`.
