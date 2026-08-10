# Spec — API Contract (Normative)

> **This document is the single normative REST contract.** Both servers must satisfy it:
> the FastAPI backend (backend mode) and the MSW + domain engine (browser mode).
> The Playwright e2e suite runs the same specs against both modes; divergence is a bug.
> Base path: `/api`. In backend mode the origin is `http://localhost:8000`.

## Conventions

- JSON everywhere; camelCase fields.
- Auth: `Authorization: Bearer <JWT>` (HS256; claims `sub`, `role`, `name`, `exp` = 24 h).
- Guest cart identity: `X-Cart-Id: <cartId>` header.
- Pagination: `?page=1&pageSize=12` → response `{ items, page, pageSize, total, totalPages }`.
- **Error envelope** (all non-2xx):

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Human readable explanation." } }
```

| HTTP | code examples |
|---|---|
| 400 | `VALIDATION_ERROR`, `COUPON_INVALID`, `COUPON_EXPIRED`, `COUPON_MIN_SUBTOTAL`, `OUT_OF_STOCK`, `EMPTY_CART`, `PAYMENT_DECLINED` |
| 401 | `UNAUTHORIZED`, `INVALID_CREDENTIALS`, `TOKEN_EXPIRED` |
| 403 | `FORBIDDEN` (role) |
| 404 | `NOT_FOUND` |
| 409 | `EMAIL_TAKEN`, `ALREADY_IN_WISHLIST` |

## Health

| Method & path | Auth | Response 200 |
|---|---|---|
| `GET /api/health` | – | `{ "status": "ok", "mode": "backend" \| "browser", "version": "1.x.x" }` |

## Auth

| Method & path | Auth | Request body | Success |
|---|---|---|---|
| `POST /api/auth/register` | – | `{ email, password, name }` | 201 `{ token, user }` |
| `POST /api/auth/login` | – | `{ email, password }` | 200 `{ token, user }` |
| `POST /api/auth/logout` | Bearer | – | 204 (stateless; client discards token) |
| `GET /api/auth/me` | Bearer | – | 200 `User` (without password) |
| `PUT /api/auth/me` | Bearer | `{ name }` | 200 `User` |
| `POST /api/auth/me/addresses` | Bearer | `Address` w/o id | 201 `Address` |
| `PUT /api/auth/me/addresses/{addressId}` | Bearer | `Address` | 200 `Address` |
| `DELETE /api/auth/me/addresses/{addressId}` | Bearer | – | 204 |

Rules: password ≥ 8 chars incl. 1 digit → else 400 `VALIDATION_ERROR`; duplicate email → 409 `EMAIL_TAKEN`;
bad login → 401 `INVALID_CREDENTIALS`. `user` shape: `{ id, email, name, role, addresses }`.

## Products & Reviews

| Method & path | Auth | Query / body | Success |
|---|---|---|---|
| `GET /api/products` | – | `search` (name+description, case-insensitive), `category`, `sort` = `price-asc`\|`price-desc`\|`name-asc`\|`name-desc`\|`rating-desc`\|`newest` (default `newest`), `page`, `pageSize` (default 12, max 48) | 200 paginated `Product[]` |
| `GET /api/products/{productId}` | – | – | 200 `Product` / 404 |
| `GET /api/categories` | – | – | 200 `Category[]` |
| `GET /api/products/{productId}/reviews` | – | – | 200 `Review[]` (newest first) |
| `POST /api/products/{productId}/reviews` | Bearer | `{ rating: 1–5, title, body }` | 201 `Review`; recomputes product rating |

## Cart

Identity resolution order: Bearer token (user cart) → `X-Cart-Id` header (guest cart).
`POST /api/cart` creates a guest cart and returns its id; the client persists it and sends `X-Cart-Id` afterwards.
On login, if an `X-Cart-Id` is also sent, the guest cart merges into the user cart (quantities added).

| Method & path | Auth | Body | Success |
|---|---|---|---|
| `POST /api/cart` | optional | – | 201 `{ cartId }` |
| `GET /api/cart` | cart identity | – | 200 `Cart` (creates empty user cart if none) |
| `POST /api/cart/items` | cart identity | `{ productId, qty }` | 201 `Cart` — adds or increments; 400 `OUT_OF_STOCK` if qty > stock |
| `PATCH /api/cart/items/{productId}` | cart identity | `{ qty }` (1–99) | 200 `Cart`; qty 0 → 400 |
| `DELETE /api/cart/items/{productId}` | cart identity | – | 200 `Cart` |
| `POST /api/cart/coupon` | cart identity | `{ code }` | 200 `Cart`; 400 `COUPON_*` on invalid/expired/min-subtotal |
| `DELETE /api/cart/coupon` | cart identity | – | 200 `Cart` |

Totals math (normative): `discount` = percent of subtotal or fixed (capped at subtotal);
`shipping` = 0 if `subtotal − discount ≥ 50`, else 4.99 (0 for empty cart); `tax` = 8% of `(subtotal − discount)`,
rounded to 2 decimals; `total = subtotal − discount + shipping + tax`.

## Coupons

| Method & path | Auth | Body | Success |
|---|---|---|---|
| `POST /api/coupons/validate` | – | `{ code, subtotal }` | 200 `{ valid: true, type, value, discount }` or 400 `COUPON_*` |

## Orders (Checkout)

| Method & path | Auth | Body | Success |
|---|---|---|---|
| `POST /api/orders` | Bearer | `{ shippingAddress, payment: { cardNumber, expiry, cvc, cardHolder } }` | 201 `Order` (status `paid`); empties the cart |
| `GET /api/orders` | Bearer | – | 200 `Order[]` (own orders, newest first) |
| `GET /api/orders/{orderId}` | Bearer | – | 200 `Order` (own or admin) / 404 |

Payment simulation (normative): card `4111 1111 1111 1111` (spaces ignored) succeeds;
card ending in `0000` → 400 `PAYMENT_DECLINED` ("test decline card"); any other Luhn-valid card succeeds;
non-Luhn → 400 `VALIDATION_ERROR`. Empty cart → 400 `EMPTY_CART`. Stock decremented on success.

## Wishlist

| Method & path | Auth | Success |
|---|---|---|
| `GET /api/wishlist` | Bearer | 200 `{ items: [{ product, addedAt }] }` |
| `POST /api/wishlist/{productId}` | Bearer | 201; 409 `ALREADY_IN_WISHLIST` |
| `DELETE /api/wishlist/{productId}` | Bearer | 204 |

## Files (download / upload practice)

| Method & path | Auth | Success |
|---|---|---|
| `GET /api/files/products.csv` | – | 200 `text/csv` + `Content-Disposition: attachment; filename="products.csv"` — live product export |
| `GET /api/files/sample-report.pdf` | – | 200 `application/pdf` + attachment disposition — small generated PDF |
| `POST /api/files/upload` | – | multipart `file`; 201 `{ fileName, sizeBytes, contentType }` (echo, nothing stored); >1 MB → 400 `VALIDATION_ERROR` |

## Admin (role `admin` required → else 403 `FORBIDDEN`)

| Method & path | Body | Success |
|---|---|---|
| `GET /api/admin/products` | `?page&pageSize&search` | 200 paginated (includes out-of-stock) |
| `POST /api/admin/products` | Product w/o id/rating | 201 `Product` |
| `PUT /api/admin/products/{id}` | partial Product | 200 `Product` |
| `DELETE /api/admin/products/{id}` | – | 204 |
| `GET /api/admin/orders` | `?status` | 200 `Order[]` (all users) |
| `PATCH /api/admin/orders/{id}/status` | `{ status }` (valid transition only) | 200 `Order`; invalid transition → 400 |
| `GET /api/admin/stats` | – | 200 `{ totalRevenue, orderCount, ordersByStatus: {...}, revenueByCategory: [{category, revenue}], topProducts: [{productId, name, unitsSold}] }` |

Valid status transitions: `pending→paid→shipped→delivered`; `pending|paid → cancelled`.

## CORS (backend mode only)

Allowed origins: `http://localhost:5173`, `http://localhost:4173`. All methods/headers.
`expose_headers: Content-Disposition` (required so download filenames are readable by JS).

## OpenAPI

FastAPI serves interactive docs at `/docs` and the schema at `/openapi.json` — advertised in the UI
as the target for API-testing practice in backend mode.
