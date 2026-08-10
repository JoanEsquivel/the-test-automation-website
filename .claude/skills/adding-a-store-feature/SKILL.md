---
name: adding-a-store-feature
description: Use when adding or changing a page, component or flow under frontend/src/pages/shop/, frontend/src/pages/account/ or frontend/src/pages/admin/ — catalog, product detail, cart, checkout, confirmation, orders, wishlist, login, register, profile, admin dashboard/products/orders — or when wiring useCart, useWishlist, TotalsBox, RequireAuth, RequireAdmin, a shop data-testid, a new lazy route in App.tsx, or a page test using @/test/shop.
---

# Adding a store feature

The store is the half of this site that pretends to be a real application: catalog → cart → checkout
→ orders → admin. Everything a practising automator does against it depends on it behaving like
production software — stable ids, visible loading, real error text.

`CLAUDE.md` carries the repo-wide rules (parity, base path, aliases, commands). This skill is the
store half; if the feature needs a new or changed endpoint, that belongs to the
**`adding-an-api-endpoint`** skill and must be done first.

## Test ids here are the exact inverse of the playground

Shop, account and admin pages use **plain, stable, kebab-case `data-testid`** on every interactive
element and every readout, and **never** import `useLocatorAttrs`. ADR-04 in
`docs/03-implementation/decisions.md` states it outright: "the store area never uses the hook at all
— the shop has stable test ids because it models a real application, not an exercise."

The whole e2e suite is built on that promise. `e2e/support/actions.ts` drives the app through
`login-form`, `login-email`, `login-password`, `login-submit`, `logout-button`, `login-link`,
`catalog-search`, `catalog-result-count`, `empty-cart`, `remove-coupon` and
`[data-testid^="remove-item-"]`. Rename one and specs break in both Playwright projects.

Conventions that already exist and should be followed:

- Per-record ids are suffixed with the record id: `cart-item-prod-pulse-earbuds`,
  `wishlist-item-${product.id}`, `move-to-cart-${product.id}`, `remove-from-wishlist-${product.id}`.
- Empty states are `empty-<thing>`: `empty-cart`, `empty-wishlist`.
- Error banners are `<area>-error`: `wishlist-error`, `coupon-banner`.

## Reuse before you write

Almost every piece a new store view needs already exists. Check this list before creating a component.

| Need | Use |
|---|---|
| Cart identity, load, mutations | `frontend/src/hooks/useCart.ts` |
| Wishlist membership + toggle | `frontend/src/hooks/useWishlist.ts` |
| Success/failure toast | `frontend/src/components/ui/Toast.tsx` — `useToast()` |
| Modal, confirmation | `components/ui/Modal.tsx`, `components/ui/ConfirmDialog.tsx` |
| Inline error / notice | `components/ui/Banner.tsx` |
| A labelled text input with hint + error | `frontend/src/pages/account/components/TextField.tsx` — it mirrors `id` into `data-testid`, which is where `login-email` and `login-password` come from |
| Status pill, button, page header | `components/ui/Badge.tsx`, `Button.tsx`, `PageIntro.tsx` |
| Money and dates | `frontend/src/pages/shop/format.ts` — `formatMoney`, `formatDate` |
| Turning a thrown `ApiError` into text | `frontend/src/api/errorMessage.ts` — `errorMessage`, `errorCode` |

`useCart` is doing more than it looks. It creates a guest cart exactly once (`ensureCartIdentity`,
guarded by a module-level `pendingCartCreation` so two mounts never create two carts), keeps
`useCartStore.itemCount` — the header badge — in sync with every response, and `addItem` bumps that
badge **optimistically and rolls it back** if the request rejects. Mutations reject with the original
`ApiError`, so the page can toast the exact contract message. Never call `api.cart.*` directly from a
page; you would lose all of that.

`ToastProvider` is already mounted in `AppLayout` — just call `useToast()`. The region is
`data-testid="toast-region"` with `role="status"`; individual toasts are `data-testid="toast"`.
`ConfirmDialog` ships `confirm-dialog`, `confirm-accept` and `confirm-cancel`.

### Shop components (`frontend/src/pages/shop/components/`)

| File | Exports worth knowing |
|---|---|
| `TotalsBox.tsx` | `TotalsBox` — the single totals readout: `totals-subtotal`, `totals-discount`, `totals-shipping`, `totals-tax`, `totals-total`, inside `totals-box` |
| `OrderStatusTimeline.tsx` | `OrderStatusTimeline`, `OrderStatusChip`, `OrderStatus` |
| `AddressForm.tsx` | `AddressForm`, `validateAddress`, `EMPTY_ADDRESS`, `AddressErrors` |
| `AddressPicker.tsx` | `AddressPicker`, `NEW_ADDRESS_ID` |
| `PaymentForm.tsx` | `PaymentForm`, `validatePayment`, `maskCardNumber`, `maskExpiry`, `maskCvc`, `cardLast4`, `EMPTY_PAYMENT` |
| `CheckoutStepper.tsx` | `CheckoutStepper`, `CHECKOUT_STEPS`, `stepIndex`, `CheckoutStep` |
| `CheckoutReview.tsx` | `CheckoutReview` |
| `Skeletons.tsx` | `ProductGridSkeleton`, `DetailSkeleton`, `ListSkeleton` |
| `CartLineItem.tsx`, `CouponForm.tsx`, `QtyStepper.tsx`, `StarRating.tsx`, `StockBadge.tsx` | one component each |

`TotalsBox` is the **only** place the normative money math from `docs/02-specs/api-contract.md` is
rendered. Do not compute or re-render totals anywhere else.

## Realism requirements

Every server-backed view must have all four. This is what makes the store worth automating against,
and reviewers check for it.

| Requirement | How |
|---|---|
| Loading skeleton | `ProductGridSkeleton` / `DetailSkeleton` / `ListSkeleton` while `loading` |
| Toast on mutation | `useToast()` after a successful add/remove/update |
| Error banner with the **exact API message** | `<Banner tone="danger" data-testid="<area>-error">{errorMessage(cause)}</Banner>` |
| Empty state | a `data-testid="empty-<thing>"` block with a link onward |

`frontend/src/pages/shop/WishlistPage.tsx` has all four in about a hundred lines — read it as the
reference implementation.

## Page test boilerplate

Store page tests are ATDD acceptance tests: write one from the spec, run it, watch it fail, then
implement. The msw/node harness in `frontend/src/test/shop.ts` runs the **real handlers against the
real engine** — these are not stubs.

```ts
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { resetClientState, server } from '@/test/shop'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
beforeEach(() => {
  resetClientState()
})
```

`resetClientState()` clears `localStorage`, calls the engine's `resetAll()` and resets the auth, cart
and mode zustand stores.

Seed preconditions by calling **engine functions directly**, then sync the store — never by clicking
through three pages. `frontend/src/pages/shop/__tests__/CartPage.test.tsx` does it in five lines:

```ts
const { cartId } = createCart(null)
addItem(null, cartId, { productId: 'prod-pulse-earbuds', qty: 1 })
useCartStore.setState({ cartId, itemCount: 1 })
```

For an authenticated page, call the engine `login(...)` and then
`useAuthStore.setState({ token, user })`.

Render inside a router with the route you are testing:

```tsx
render(
  <MemoryRouter initialEntries={['/shop/cart']}>
    <CartPage />
  </MemoryRouter>,
)
```

**Always `await screen.findByTestId(id, {}, { timeout: 4000 })` before asserting.** The engine injects
simulated latency even under test (ADR-15); a bare `getByTestId` on first render is a guaranteed
flake. Assert on the settled node, then use `getByTestId` for its siblings.

## Routing

All routes live in `frontend/src/App.tsx` and are `lazy()`-loaded.

1. Public store pages sit directly under the `AppLayout` route: `shop`, `shop/catalog`,
   `shop/product/:productId`, `shop/cart`, `account/login`, `account/register`.
2. Signed-in-only pages go **inside** the `<Route element={<RequireAuth />}>` layout route:
   `account/profile`, `shop/checkout`, `shop/orders`, `shop/orders/:orderId/confirmation`,
   `shop/orders/:orderId`, `shop/wishlist`. `RequireAuth` redirects anonymous visitors to
   `/account/login?returnTo=<encoded path+search>`.
3. Admin pages go inside `<Route element={<RequireAdmin />}>`: `admin`, `admin/products`,
   `admin/orders`. `RequireAdmin` renders a styled 403 page (`data-testid="forbidden"`) for a
   signed-in non-admin rather than bouncing them.

**Route ordering trap:** `shop/orders/:orderId/confirmation` must be declared **before**
`shop/orders/:orderId`, or the parameterised route swallows it. The existing file has a comment
saying so. Any new sub-route of a `:param` route needs the same treatment.

## Two gates a new page must clear

- **Accessibility.** A new user-facing page must be added to the explicit `PAGES` array in
  `e2e/tests/accessibility.spec.ts`. The gate is **zero `serious` or `critical`** axe violations.
  If the page renders a skeleton first, add a settle step next to the existing
  `waitForCatalog(page)` / `empty-cart` cases — a skeleton is not the page under test. (The
  playground category pages are excluded on purpose; the store is not.)
- **Parity.** `npm run e2e` runs the same specs against `browser-mode` and `backend-mode`. Green in
  one and red in the other is an app defect, never a flaky test.

## Seed fixtures the tests rely on

`shared/seed/*.json` is read by FastAPI at startup **and** by the frontend through the `@seed` alias,
and e2e fixtures name records by id — editing it can break three places at once.

| Fixture | Value |
|---|---|
| Customer | `customer@example.com` / `Password123!` (Casey Customer) |
| Admin | `admin@example.com` / `Admin123!` (Alex Admin) |
| Card that succeeds | `4111 1111 1111 1111`, expiry `12/30`, cvc `123` |
| Card that declines | any number whose digits end `0000` — `PAYMENT_DECLINED` |
| Coupons | `WELCOME10` (10%, valid) · `SAVE20` ($20 off, needs $100+) · `EXPIRED50` · `DISABLED5` |
| E2E fixture product | `prod-cable-clip` — $0.99, stock 500 (under free-shipping, never sells out) |
| Out-of-stock product | `prod-studio-mic` — stock 0 |

The mirrored constants for specs are in `e2e/support/constants.ts` (`CUSTOMER`, `ADMIN`, `CARDS`,
`FIXTURE_PRODUCT`, `expectedTotals()`). Import from there rather than hard-coding.

## Red flags — STOP

- You imported `useLocatorAttrs` into a shop, account or admin file. That hook is playground-only.
- You wrote a `data-testid` that is not stable kebab-case, or renamed one that
  `e2e/support/actions.ts` uses.
- You called `api.cart.*` from a page instead of going through `useCart`.
- You recomputed subtotal/shipping/tax/total instead of rendering `TotalsBox`.
- Your page has no skeleton, no toast, no error banner, or no empty state.
- Your test asserts with `getByTestId` on first render instead of awaiting
  `findByTestId(..., { timeout: 4000 })`.
- Your test seeds state by clicking through the UI instead of calling engine functions.
- You added a `:param` route above its more specific sibling.
- You added a user-facing page and did not add it to `PAGES` in `e2e/tests/accessibility.spec.ts`.
- The feature needs a field the API does not return, and you are about to add it to the engine only.
  Stop and use the **`adding-an-api-endpoint`** skill — both twins and `api-contract.md` change
  together.

## Verify

```sh
npx vitest run                 # in frontend/
npx oxlint                     # in frontend/
npm run build                  # typecheck + build, from the repo root
npm run e2e                    # both modes — the parity gate
```

Use the **`verifying-changes`** skill before claiming the work is done; it covers how to triage each
of these.
