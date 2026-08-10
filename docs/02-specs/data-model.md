# Spec — Data Model

> Stage 2 (spec-driven development). Normative for both backends: FastAPI (`backend/app/schemas/`)
> and the browser domain engine (`frontend/src/api/types.ts` + `frontend/src/engine/`).
> Seed data lives in `shared/seed/*.json` — the single source of truth for both modes.

## Conventions

- IDs are deterministic, human-readable slugs or prefixed strings (stable across modes/resets).
- Timestamps are ISO-8601 UTC strings (`2026-08-09T12:00:00Z`).
- Money values are numbers in USD with 2 decimals.
- Field names are camelCase in JSON payloads (FastAPI schemas use aliases).

## Entities

### Product (`shared/seed/products.json`)

| Field | Type | Notes |
|---|---|---|
| id | string | e.g. `prod-aurora-headphones` |
| name | string | |
| description | string | 2–4 sentences |
| price | number | |
| category | string | one of `categories.json` ids |
| tags | string[] | |
| stock | int | `0` for at least one product (out-of-stock testing) |
| imageEmoji | string | emoji used as product art (no binary assets) |
| rating | number | derived: average of reviews, 1 decimal; `0` if none |
| createdAt | string | |

Seed: **24 products** across **5 categories** (`audio`, `wearables`, `gaming`, `smart-home`, `accessories`).
At least: 1 out-of-stock, 1 price `0.99`, 1 price `> 1000`, 1 with very long name (truncation testing).

### User (`shared/seed/users.json`)

| Field | Type | Notes |
|---|---|---|
| id | string | `user-customer`, `user-admin` |
| email | string | unique, login key |
| password | string | seed only stores plaintext for the demo; backend hashes at load (bcrypt-like via sha256+salt is acceptable — no external dep), engine compares plaintext |
| name | string | |
| role | `customer` \| `admin` | |
| addresses | Address[] | |

Seed users (also printed on the login page):
- `customer@example.com` / `Password123!` (role `customer`, 2 addresses)
- `admin@example.com` / `Admin123!` (role `admin`)

### Address

| Field | Type |
|---|---|
| id | string |
| label | string (`Home`, `Office`) |
| fullName | string |
| street | string |
| city | string |
| zip | string |
| country | string |
| isDefault | boolean |

### Cart (runtime only — never seeded)

| Field | Type | Notes |
|---|---|---|
| id | string | `cart-<random>` |
| items | CartItem[] | |
| couponCode | string \| null | |
| totals | Totals | recomputed on every mutation |

**CartItem**: `productId`, `name`, `unitPrice`, `qty` (1–99), `lineTotal`.
**Totals**: `subtotal`, `discount`, `shipping` (flat 4.99, free ≥ 50 after discount), `tax` (8% of subtotal−discount), `total`.

Cart ownership: header `X-Cart-Id` for guests; carts merge into the user's cart on login.

### Order (runtime only)

| Field | Type | Notes |
|---|---|---|
| id | string | `order-<random>` |
| orderNumber | string | `TAW-2026-0001` sequential per session |
| userId | string | |
| items | CartItem[] | snapshot |
| shippingAddress | Address | snapshot |
| paymentMethod | object | `{ type: "card", last4: "1111" }` — simulated |
| status | `pending` → `paid` → `shipped` → `delivered` (admin can also set `cancelled`) | |
| totals | Totals | snapshot |
| createdAt | string | |

### Review (`shared/seed/reviews.json`)

`id`, `productId`, `userId | null`, `authorName`, `rating` (int 1–5), `title`, `body`, `createdAt`.
Seed: **~40 reviews** distributed unevenly (some products none — empty-state testing).

### Coupon (`shared/seed/coupons.json`)

| code | type | value | minSubtotal | expiresAt | active | Purpose |
|---|---|---|---|---|---|---|
| `WELCOME10` | percent | 10 | 0 | 2030-01-01 | true | happy path |
| `SAVE20` | fixed | 20 | 100 | 2030-01-01 | true | min-subtotal negative test |
| `EXPIRED50` | percent | 50 | 0 | 2020-01-01 | true | expired negative test |
| `DISABLED5` | fixed | 5 | 0 | 2030-01-01 | false | inactive negative test |

### WishlistItem (runtime only)

`userId`, `productId`, `addedAt`. Unique per (user, product).

### Category (`shared/seed/categories.json`)

`id`, `name`, `emoji`, `description`.

## Persistence

- **Backend mode**: everything in Python process memory; restart = reset to seed.
- **Browser mode**: engine repositories under versioned localStorage keys
  `taw:engine:v1:<entity>`; version bump invalidates old state; "Reset demo data"
  clears `taw:engine:v1:*` and reseeds.
