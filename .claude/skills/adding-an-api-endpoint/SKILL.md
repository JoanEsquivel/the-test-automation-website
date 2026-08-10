---
name: adding-an-api-endpoint
description: Use when adding, changing or removing an API endpoint, route, status code or request/response shape in this repo — editing backend/app/routers/*.py, frontend/src/engine/*.ts, frontend/src/mocks/handlers.ts, frontend/src/api/client.ts, frontend/src/api/types.ts or docs/02-specs/api-contract.md; also when an endpoint answers differently in backend mode than in browser mode, or a new error code (OUT_OF_STOCK, COUPON_INVALID, FORBIDDEN…) must be returned.
---

# Adding an API endpoint

Every API behaviour in this repo exists **twice**: FastAPI in `backend/app/` and a pure TypeScript
engine in `frontend/src/engine/` behind Mock Service Worker. `frontend/src/api/client.ts` always
issues a real `fetch`; `frontend/src/api/mode.ts` decides whether it lands on
`http://localhost:8000/api` (backend mode) or `${import.meta.env.BASE_URL}api` (browser mode, where
MSW intercepts).

Nothing in the type system connects the two. A half-done endpoint compiles, passes lint, and fails on
the deployed site or in the second Playwright project — the most expensive place to find it.

## The three parity artifacts (ADR-01)

| Artifact | What it pins |
|---|---|
| `docs/02-specs/api-contract.md` | The normative contract. Both implementations are written against **the doc**, never against each other. |
| `shared/seed/*.json` | The same demo data: FastAPI reads it at startup, the frontend bundles it via the `@seed` alias. |
| `e2e/tests/*.spec.ts` | One set of specs, run twice — `browser-mode` and `backend-mode`. |

## Twin mapping — NOT a basename substitution

This is where changes go wrong. Three of the engine modules do not share a name with their twin.

| Engine module | Python twin |
|---|---|
| `frontend/src/engine/admin.ts` `auth.ts` `cart.ts` `files.ts` `orders.ts` `reviews.ts` `wishlist.ts` | `backend/app/routers/<same name>.py` |
| `frontend/src/engine/catalog.ts` | `backend/app/routers/products.py` |
| `frontend/src/engine/coupons.ts` | `backend/app/routers/cart.py` — the `/api/coupons/validate` endpoint lives there |
| `frontend/src/engine/commerce.ts` | `backend/app/services/commerce.py` |
| `frontend/src/engine/store.ts` | `backend/app/store/memory.py` |
| `frontend/src/engine/token.ts` | `backend/app/core/security.py` |
| `frontend/src/engine/errors.ts` | `backend/app/core/errors.py` |

Backend test files are per domain but not one-per-router: reviews and wishlist share
`backend/tests/test_reviews_wishlist.py`, and `frontend/src/engine/catalog.ts` is covered by
`backend/tests/test_products.py`. Check `ls backend/tests/` before creating a new file.

## The ordered workflow

Do these in order. Steps 1–7 are mandatory for every endpoint change.

1. **`docs/02-specs/api-contract.md` first.** Add or edit the row: method & path, auth, request
   body/query, success status, error codes. If you cannot write the row, you are not ready to write
   code. Codes must come from the table in the "Conventions" section of that doc.

2. **`backend/tests/test_<domain>.py`** — write the acceptance test from the row and **run it and watch
   it fail**. ATDD is not optional here; every feature in this repo was built that way. Boilerplate
   from `backend/tests/conftest.py`:

   ```python
   def test_add_item_rejects_qty_zero(client, customer_headers):
       response = client.post("/api/cart/items", json={"productId": "p-001", "qty": 0}, headers=customer_headers)
       assert response.status_code == 400
       assert response.json()["error"]["code"] == "VALIDATION_ERROR"
   ```

   The `client` fixture is `TestClient(create_app())` — a fresh app and a fresh in-memory store per
   test. `customer_headers` and `admin_headers` log in for real as `customer@example.com` /
   `Password123!` and `admin@example.com` / `Admin123!`.

3. **`backend/app/routers/<domain>.py`** — implement until green. Also touch, as needed:
   `backend/app/schemas/*.py` for Pydantic shapes, `backend/app/services/commerce.py` if money is
   involved, `backend/app/store/memory.py` for new state.

4. **`frontend/src/engine/<domain>.ts`** — the TypeScript twin. Keep the header comment naming the
   Python twin; the existing ones read:

   ```ts
   /** Engine cart — mirrors backend/app/routers/cart.py behavior 1:1.
    * Identity resolution: Bearer token first (user-bound cart), then X-Cart-Id.
    */
   ```

   Money math must match line for line. Both sides round with a `round2` that adds `1e-9` first —
   `Math.round((value + 1e-9) * 100) / 100` in `frontend/src/engine/commerce.ts`,
   `round(value + 1e-9, 2)` in `backend/app/services/commerce.py`. Do not "simplify" either one.

5. **`frontend/src/engine/__tests__/<domain>.test.ts`** — the same cases as step 2. No DOM, no MSW,
   no React. Boilerplate:

   ```ts
   beforeEach(() => {
     localStorage.clear()
     resetAll()
   })
   ```

   Assert errors structurally, never on message text:

   ```ts
   expect(() => getCart(null, null)).toThrowError(
     expect.objectContaining({ status: 401, code: 'UNAUTHORIZED' }),
   )
   ```

6. **`frontend/src/mocks/handlers.ts`** — a **thin** adapter (ADR-03): parse the request, make one
   engine call, wrap it in the shared `run(fn, status)` helper. `run` adds simulated latency, turns
   `undefined` into a 204, and routes thrown `EngineError`s through `errorResponse()`.

   ```ts
   http.post('*/api/cart/items', async ({ request }) => {
     const body = (await request.json()) as { productId: string; qty: number }
     return run(() => cart.addItem(bearerToken(request), cartIdHeader(request), body), 201)
   }),
   ```

   The `*/api/...` wildcard is mandatory — `http.post('/api/cart/items')` works in dev and dies under
   the `/the-test-automation-website/` Pages base path.

7. **`frontend/src/api/types.ts`, then `frontend/src/api/client.ts`** — add the response type, then a
   typed method on the `api` object. `client.ts` is the **only** place URLs are written, and it already
   attaches `Authorization` and `X-Cart-Id` for you:

   ```ts
   addItem: (productId: string, qty: number) => request<Cart>('POST', '/cart/items', { body: { productId, qty } }),
   ```

8. **UI + page tests** under `frontend/src/pages/**/__tests__/`, using the msw/node harness in
   `frontend/src/test/shop.ts` (`server`, `resetClientState()`). Engine latency is real here — see
   `verifying-changes` for the `{ timeout: 4000 }` rule.

9. **`e2e/tests/*.spec.ts`** if the change is user-visible. Mode-agnostic only: relative
   `page.goto('shop/catalog')`, never a leading slash. Update `e2e/support/constants.ts` if a
   normative constant changed — it re-derives totals independently on purpose, so do not import app
   code into it. A brand-new user-facing page also goes into the `PAGES` list in
   `e2e/tests/accessibility.spec.ts`.

## The error envelope

Every non-2xx body is `{ "error": { "code": ..., "message": ... } }`. The chain:

| Layer | Mechanism |
|---|---|
| FastAPI | `raise ApiError(401, "UNAUTHORIZED", "…")` from `backend/app/core/errors.py` |
| Engine | `throw new EngineError(401, 'UNAUTHORIZED', '…')` from `frontend/src/engine/errors.ts` |
| MSW | the single `errorResponse()` in `frontend/src/mocks/handlers.ts` converts one into the other |
| Client | `client.ts` parses the body back into an `ApiError` with `.status` and `.code` |

Codes actually in use — do not invent a new one without adding it to `docs/02-specs/api-contract.md`:
`VALIDATION_ERROR`, `UNAUTHORIZED`, `INVALID_CREDENTIALS`, `TOKEN_EXPIRED`, `FORBIDDEN`, `NOT_FOUND`,
`EMAIL_TAKEN`, `ALREADY_IN_WISHLIST`, `OUT_OF_STOCK`, `EMPTY_CART`, `PAYMENT_DECLINED`,
`COUPON_INVALID`, `COUPON_EXPIRED`, `COUPON_MIN_SUBTOTAL`.

## Cart identity

Any cart-touching endpoint resolves identity the same way in both stacks: **Bearer token first**
(user-bound cart), **then the `X-Cart-Id` header**. Missing identity is **401 `UNAUTHORIZED`**, never
404 — see `get_cart` in `backend/app/routers/cart.py` and `resolve` in `frontend/src/engine/cart.ts`.

`client.ts` attaches `X-Cart-Id` from `useCartStore` automatically. An `X-Cart-Id` present on login
triggers a guest-cart merge, implemented in `backend/app/routers/auth.py` and in the
`*/api/auth/login` handler in `handlers.ts` (`cart.mergeGuestCartIntoUser`). Both must keep doing it.

## Red flags — STOP

- About to write business logic inside `frontend/src/mocks/handlers.ts`.
- Changed `backend/app/routers/` without opening the engine twin in the same change (or vice versa).
- Wrote a handler path as `/api/...` instead of `*/api/...`.
- Wrote a URL anywhere other than `frontend/src/api/client.ts`.
- Invented an error code that is not in `docs/02-specs/api-contract.md`.
- Reached for 404 when a request has no cart identity.
- Implementation written before the failing acceptance test ran.
- Ran only one Playwright project after touching the API.

## Rationalisations

| Excuse | Reality |
|---|---|
| "It's a read-only endpoint, the engine can wait." | Browser mode *is* the deployed site. An engine-less endpoint is a 404 on GitHub Pages for every visitor. |
| "The doc is descriptive, I'll update it after." | ADR-01 makes it normative. Both implementations are written against the doc; skip it and the two sides are being written against each other. |
| "One line of logic in the handler is harmless." | It is untestable by `npx vitest run` at the engine level and invisible to pytest. ADR-03 puts logic in `src/engine/` for exactly that reason. |
| "Backend rounds a cent differently, close enough." | `e2e/support/constants.ts` re-derives totals independently; a cent of drift fails one Playwright project and not the other. |
| "The engine test duplicates the pytest test." | That duplication *is* the parity gate. Two implementations need two suites. |
| "Vitest and pytest are green, ship it." | Neither runs the real HTTP path against the built Pages artifact. Only `npm run e2e` does. |

## Finishing

Run all five gates from the `verifying-changes` skill. Gate 5 (`npm run e2e`, both projects) is
non-negotiable for an API change: running a single project proves nothing about parity.
