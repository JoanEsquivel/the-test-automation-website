/** MSW handlers: thin adapters that parse requests, delegate to the domain
 * engine and wrap responses in the same envelopes FastAPI produces.
 * NO business logic lives here — it all sits in src/engine/ (unit-testable).
 *
 * Paths use the '*\/api/...' wildcard so they match both the dev origin (/api)
 * and the GitHub Pages base path (/the-test-automation-website/api).
 */

import { delay, http, HttpResponse } from 'msw'

import * as auth from '@/engine/auth'
import * as catalog from '@/engine/catalog'
import { EngineError } from '@/engine/errors'
import type { ProductQuery } from '@/api/types'

const APP_VERSION = '1.0.0'

/** Simulated network latency so async UI behavior resembles a real backend. */
async function latency() {
  await delay(150 + Math.random() * 250)
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization')
  return header?.startsWith('Bearer ') ? header.slice(7) : null
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
    return run(() => auth.login(body))
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
]
