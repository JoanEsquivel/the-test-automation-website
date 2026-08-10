/** localStorage-backed repositories for the in-browser domain engine.
 *
 * Single source of truth is shared/seed/*.json (also loaded by FastAPI).
 * Keys are versioned: bumping ENGINE_VERSION invalidates stale persisted state.
 */

import seedCategories from '@seed/categories.json'
import seedCoupons from '@seed/coupons.json'
import seedProducts from '@seed/products.json'
import seedReviews from '@seed/reviews.json'
import seedUsers from '@seed/users.json'

export const ENGINE_VERSION = 'v1'
const PREFIX = `taw:engine:${ENGINE_VERSION}:`

export interface StoredUser {
  id: string
  email: string
  password: string
  name: string
  role: 'customer' | 'admin'
  addresses: {
    id: string
    label: string
    fullName: string
    street: string
    city: string
    zip: string
    country: string
    isDefault: boolean
  }[]
}

type SeedProduct = Omit<import('@/api/types').Product, 'rating'>

const SEEDS: Record<string, unknown> = {
  products: seedProducts satisfies SeedProduct[],
  users: seedUsers,
  reviews: seedReviews,
  coupons: seedCoupons,
  categories: seedCategories,
  carts: [],
  orders: [],
  wishlists: {},
  meta: { orderCounter: 0 },
}

function read<T>(name: string): T {
  const raw = localStorage.getItem(PREFIX + name)
  if (raw !== null) {
    try {
      return JSON.parse(raw) as T
    } catch {
      // fall through to reseed on corrupted state
    }
  }
  const seeded = structuredClone(SEEDS[name])
  localStorage.setItem(PREFIX + name, JSON.stringify(seeded))
  return seeded as T
}

function write(name: string, value: unknown): void {
  localStorage.setItem(PREFIX + name, JSON.stringify(value))
}

export const db = {
  get products() {
    return read<SeedProduct[]>('products')
  },
  set products(value: SeedProduct[]) {
    write('products', value)
  },
  get users() {
    return read<StoredUser[]>('users')
  },
  set users(value: StoredUser[]) {
    write('users', value)
  },
  get reviews() {
    return read<import('@/api/types').Review[]>('reviews')
  },
  set reviews(value: import('@/api/types').Review[]) {
    write('reviews', value)
  },
  get coupons() {
    return read<import('@/api/types').Coupon[]>('coupons')
  },
  get categories() {
    return read<import('@/api/types').Category[]>('categories')
  },
  get carts() {
    return read<EngineCart[]>('carts')
  },
  set carts(value: EngineCart[]) {
    write('carts', value)
  },
  get orders() {
    return read<import('@/api/types').Order[]>('orders')
  },
  set orders(value: import('@/api/types').Order[]) {
    write('orders', value)
  },
  get wishlists() {
    return read<Record<string, { productId: string; addedAt: string }[]>>('wishlists')
  },
  set wishlists(value: Record<string, { productId: string; addedAt: string }[]>) {
    write('wishlists', value)
  },
  get meta() {
    return read<{ orderCounter: number }>('meta')
  },
  set meta(value: { orderCounter: number }) {
    write('meta', value)
  },
}

export interface EngineCart extends Omit<import('@/api/types').Cart, 'totals'> {
  ownerUserId: string | null
  totals: import('@/api/types').Totals
}

export function newId(prefix: string): string {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `${prefix}-${hex}`
}

export function nowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
}

/** Wipe all engine state and reseed from the shared JSON ("Reset demo data"). */
export function resetAll(): void {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(`taw:engine:`)) {
      localStorage.removeItem(key)
    }
  }
}
