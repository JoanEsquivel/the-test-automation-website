# Spec — Ecommerce Demo ("TAW Store")

> A realistic, complete shop flow composed from playground elements. Route prefix: `/shop`.
> Admin at `/admin`. All pages self-describing via `PageIntro`.

## Entry pre-screen (`/shop`) — REQUIRED before the store

`ShopIntroPage` is the mandatory landing for the ecommerce path. Content:

1. **What this is**: a fully functional simulated store for practicing end-to-end automation.
2. **Feature checklist** (rendered as a scannable grid, all implemented): catalog with
   search/filter/sort/pagination · product detail · reviews & ratings · wishlist · cart ·
   coupon codes · guest + logged-in carts with merge · 3-step checkout · simulated payment ·
   order history · profile & address book · admin dashboard (role-based).
3. **Mode warning panel** (prominent, `data-testid="mode-warning"`):
   - *Backend mode (local)*: real HTTP against FastAPI at `localhost:8000` — use Postman/RestAssured
     against `/docs`; data resets on server restart.
   - *Browser mode (this deployed site / fallback)*: the same API served in-browser by a service
     worker; data persists in localStorage; **real network-level API testing requires local mode**.
   - Current mode pill shown inline.
4. **Test credentials** card: `customer@example.com / Password123!`, `admin@example.com / Admin123!`,
   payment cards (`4111 1111 1111 1111` succeeds, any card ending `0000` declines), coupon list
   with expected behavior (WELCOME10 ✓, SAVE20 needs $100+, EXPIRED50 ✗, DISABLED5 ✗).
5. **Reset demo data** button (browser mode) with confirm dialog.
6. **Enter the store** CTA → `/shop/catalog`.

## Customer journey

| Route | Page | Key behaviors (acceptance criteria) |
|---|---|---|
| `/shop/catalog` | Catalog | Search box (debounced 300 ms), category filter chips, sort dropdown, pagination (12/page). URL reflects state (`?search=&category=&sort=&page=`) so deep links are testable. Product cards: emoji art, name, price, rating stars, stock badge ("Only N left" < 5, "Out of stock" disables add). Add-to-cart button on card. Empty-state for no results. |
| `/shop/product/:id` | Product detail | Gallery block, price, stock, qty stepper (1–99, clamped), Add to cart, Wishlist heart (auth required → redirects to login with `?returnTo=`), tabbed Description / Reviews. Reviews: list + "Write a review" (auth) with 1–5 star picker; new review appears immediately and updates the average. |
| `/shop/cart` | Cart | Line items with qty steppers and remove; coupon input + apply/remove with success/error banners matching `COUPON_*` codes; totals box (subtotal, discount, shipping incl. "free over $50" hint, tax, total) recalculated live; "Proceed to checkout" (login required → redirect with return). Guest cart persists via `X-Cart-Id` stored in localStorage; merges on login. |
| `/shop/checkout` | 3-step wizard | Stepper header (Shipping → Payment → Review). **Shipping**: choose saved address or fill new form (all fields validated inline). **Payment**: card form with input masking (`#### #### #### ####`), expiry `MM/YY` future-dated, CVC 3–4 digits; validation errors per field. **Review**: read-only summary of items, address, card last4, totals; "Place order" submits; declined card shows API error banner and returns to Payment. Success → `/shop/orders/:id/confirmation` with big order number and "what happened" explanation. |
| `/shop/orders` | Order history | Table of own orders (number, date, status chip, total) linking to detail. Empty state for new users. |
| `/shop/orders/:id` | Order detail | Items snapshot, address, payment last4, totals, status timeline component. |
| `/shop/wishlist` | Wishlist | Grid of hearted products, move-to-cart button, remove. |
| `/account/login`, `/account/register` | Auth | Forms with inline validation, seed credentials helper card on login, error banners for 401/409. Successful auth returns to `?returnTo` or home. |
| `/account/profile` | Profile | Edit name; address book CRUD (add/edit/delete, set default); logout. |

Header (store area): logo, search shortcut, mode pill + toggle, cart icon with live item-count
badge (`data-testid="cart-count"`), wishlist icon, user menu (login/register or name + logout;
admin link when role=admin).

## Admin (`/admin`, role `admin` only)

- Route guard: unauthenticated → login redirect; authenticated non-admin → styled **403 page**.
- `/admin` Dashboard: 4 stat tiles (revenue, orders, avg order value, low-stock count) +
  2 charts (revenue by category bar, orders by status donut) from `/api/admin/stats`.
- `/admin/products`: searchable paginated table; create/edit in a modal form; delete with
  confirm dialog; stock and price editable.
- `/admin/orders`: table of all orders with status filter; status transition dropdown enforcing
  the valid transition graph; invalid transitions rejected with visible error.

## Realism requirements

- Loading skeletons on every server-backed view (engine adds 150–400 ms jitter latency).
- Optimistic cart-count updates with rollback on error.
- All mutations show toast confirmations (reusing the playground toast system).
- Form validation mirrors API rules exactly (client + server both enforce).
- Prices, totals, tax math identical in both modes (normative math in api-contract.md).

## Out of scope (YAGNI, documented deliberately)

Real payments, emails, inventory reservations, multi-currency, i18n (site is English-only).
