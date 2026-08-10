/** MSW handlers: thin adapters that parse requests, delegate to the domain
 * engine and wrap responses in the same envelopes FastAPI produces.
 * NO business logic lives here — it all sits in src/engine/ (unit-testable).
 *
 * Paths use the '*\/api/...' wildcard so they match both the dev origin (/api)
 * and the GitHub Pages base path (/the-test-automation-website/api).
 */

import { delay, http, HttpResponse } from 'msw'

import * as auth from '@/engine/auth'
import * as cart from '@/engine/cart'
import * as catalog from '@/engine/catalog'
import * as coupons from '@/engine/coupons'
import * as files from '@/engine/files'
import * as orders from '@/engine/orders'
import * as reviews from '@/engine/reviews'
import * as wishlist from '@/engine/wishlist'
import { EngineError } from '@/engine/errors'
import type { AddressInput, PaymentInput, ProductQuery } from '@/api/types'

const APP_VERSION = '1.0.0'

/** Simulated network latency so async UI behavior resembles a real backend.
 * Near-zero under Vitest to keep the suite fast. */
async function latency() {
  await delay(import.meta.env.MODE === 'test' ? 1 : 150 + Math.random() * 250)
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization')
  return header?.startsWith('Bearer ') ? header.slice(7) : null
}

function cartIdHeader(request: Request): string | null {
  return request.headers.get('X-Cart-Id')
}

function errorResponse(error: unknown) {
  if (error instanceof EngineError) {
    return HttpResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    )
  }
  return HttpResponse.json(
    { error: { code: 'ERROR', message: 'Unexpected engine error.' } },
    { status: 500 },
  )
}

/** Wrap an engine call: latency + error envelope. */
async function run<T>(fn: () => T, status = 200): Promise<Response> {
  await latency()
  try {
    const result = fn()
    if (result === undefined) return new HttpResponse(null, { status: 204 })
    return HttpResponse.json(result as object, { status })
  } catch (error) {
    return errorResponse(error)
  }
}

export const handlers = [
  http.get('*/api/health', async () => {
    await latency()
    return HttpResponse.json({ status: 'ok', mode: 'browser', version: APP_VERSION })
  }),

  // -- auth -----------------------------------------------------------------
  http.post('*/api/auth/register', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string; name: string }
    return run(() => auth.register(body), 201)
  }),
  http.post('*/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    const guestCartId = cartIdHeader(request)
    return run(() => {
      const result = auth.login(body)
      // Mirror the backend: an X-Cart-Id on login merges the guest cart.
      if (guestCartId) cart.mergeGuestCartIntoUser(guestCartId, result.user.id)
      return result
    })
  }),
  http.post('*/api/auth/logout', async ({ request }) =>
    run(() => {
      auth.requireUser(bearerToken(request))
      return undefined
    }),
  ),
  http.get('*/api/auth/me', async ({ request }) => run(() => auth.me(bearerToken(request)))),
  http.put('*/api/auth/me', async ({ request }) => {
    const body = (await request.json()) as { name: string }
    return run(() => auth.updateProfile(bearerToken(request), body))
  }),
  http.post('*/api/auth/me/addresses', async ({ request }) => {
    const body = (await request.json()) as Parameters<typeof auth.addAddress>[1]
    return run(() => auth.addAddress(bearerToken(request), body), 201)
  }),
  http.put('*/api/auth/me/addresses/:addressId', async ({ request, params }) => {
    const body = (await request.json()) as Parameters<typeof auth.updateAddress>[2]
    return run(() => auth.updateAddress(bearerToken(request), params.addressId as string, body))
  }),
  http.delete('*/api/auth/me/addresses/:addressId', async ({ request, params }) =>
    run(() => auth.deleteAddress(bearerToken(request), params.addressId as string)),
  ),

  // -- catalog ----------------------------------------------------------------
  http.get('*/api/products', async ({ request }) => {
    const url = new URL(request.url)
    const query: ProductQuery = {
      search: url.searchParams.get('search') ?? undefined,
      category: url.searchParams.get('category') ?? undefined,
      sort: (url.searchParams.get('sort') as ProductQuery['sort']) ?? undefined,
      page: url.searchParams.has('page') ? Number(url.searchParams.get('page')) : undefined,
      pageSize: url.searchParams.has('pageSize') ? Number(url.searchParams.get('pageSize')) : undefined,
    }
    return run(() => catalog.listProducts(query))
  }),
  http.get('*/api/products/:productId/reviews', async ({ params }) =>
    run(() => catalog.listReviews(params.productId as string)),
  ),
  http.get('*/api/products/:productId', async ({ params }) =>
    run(() => catalog.getProduct(params.productId as string)),
  ),
  http.get('*/api/categories', async () => run(() => catalog.listCategories())),
  http.post('*/api/products/:productId/reviews', async ({ request, params }) => {
    const body = (await request.json()) as { rating: number; title: string; body: string }
    return run(() => reviews.createReview(bearerToken(request), params.productId as string, body), 201)
  }),

  // -- cart ---------------------------------------------------------------
  http.post('*/api/cart', async ({ request }) => run(() => cart.createCart(bearerToken(request)), 201)),
  http.get('*/api/cart', async ({ request }) =>
    run(() => cart.getCart(bearerToken(request), cartIdHeader(request))),
  ),
  http.post('*/api/cart/items', async ({ request }) => {
    const body = (await request.json()) as { productId: string; qty: number }
    return run(() => cart.addItem(bearerToken(request), cartIdHeader(request), body), 201)
  }),
  http.patch('*/api/cart/items/:productId', async ({ request, params }) => {
    const body = (await request.json()) as { qty: number }
    return run(() =>
      cart.updateItem(bearerToken(request), cartIdHeader(request), params.productId as string, body.qty),
    )
  }),
  http.delete('*/api/cart/items/:productId', async ({ request, params }) =>
    run(() => cart.removeItem(bearerToken(request), cartIdHeader(request), params.productId as string)),
  ),
  http.post('*/api/cart/coupon', async ({ request }) => {
    const body = (await request.json()) as { code: string }
    return run(() => cart.applyCoupon(bearerToken(request), cartIdHeader(request), body.code))
  }),
  http.delete('*/api/cart/coupon', async ({ request }) =>
    run(() => cart.removeCoupon(bearerToken(request), cartIdHeader(request))),
  ),
  http.post('*/api/coupons/validate', async ({ request }) => {
    const body = (await request.json()) as { code: string; subtotal: number }
    return run(() => coupons.validateCouponForSubtotal(body.code, body.subtotal))
  }),

  // -- orders -------------------------------------------------------------
  http.post('*/api/orders', async ({ request }) => {
    const body = (await request.json()) as { shippingAddress: AddressInput; payment: PaymentInput }
    return run(() => orders.checkout(bearerToken(request), body), 201)
  }),
  http.get('*/api/orders', async ({ request }) => run(() => orders.listOrders(bearerToken(request)))),
  http.get('*/api/orders/:orderId', async ({ request, params }) =>
    run(() => orders.getOrder(bearerToken(request), params.orderId as string)),
  ),

  // -- wishlist -----------------------------------------------------------
  http.get('*/api/wishlist', async ({ request }) => run(() => wishlist.listWishlist(bearerToken(request)))),
  http.post('*/api/wishlist/:productId', async ({ request, params }) =>
    run(() => wishlist.addToWishlist(bearerToken(request), params.productId as string), 201),
  ),
  http.delete('*/api/wishlist/:productId', async ({ request, params }) =>
    run(() => wishlist.removeFromWishlist(bearerToken(request), params.productId as string)),
  ),

  // -- files ------------------------------------------------------------------
  // In browser mode the service worker streams these generated blobs, so the
  // download links behave exactly like real attachment responses.
  http.get('*/api/files/products.csv', async () => {
    await latency()
    return new HttpResponse(files.productsCsv(), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="products.csv"',
      },
    })
  }),
  http.get('*/api/files/sample-report.pdf', async () => {
    await latency()
    return new HttpResponse(new Uint8Array(files.sampleReportPdf()).buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="sample-report.pdf"',
      },
    })
  }),
  http.post('*/api/files/upload', async ({ request }) => {
    const formData = await request.formData()
    const filePart = formData.get('file')
    return run(() => files.echoUpload(filePart instanceof File ? filePart : null), 201)
  }),
]
