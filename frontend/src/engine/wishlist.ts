/** Engine wishlist — mirrors backend/app/routers/wishlist.py behavior 1:1. */

import type { WishlistEntry } from '@/api/types'
import { requireUser } from './auth'
import { getProduct } from './catalog'
import { EngineError } from './errors'
import { db, nowIso } from './store'

export function listWishlist(token: string | null): { items: WishlistEntry[] } {
  const user = requireUser(token)
  const entries = db.wishlists[user.id] ?? []
  const items: WishlistEntry[] = []
  for (const entry of entries) {
    try {
      items.push({ product: getProduct(entry.productId), addedAt: entry.addedAt })
    } catch {
      // product was deleted; skip the stale entry (backend does the same)
    }
  }
  return { items }
}

export function addToWishlist(token: string | null, productId: string): { productId: string; addedAt: string } {
  const user = requireUser(token)
  if (!db.products.some((p) => p.id === productId)) {
    throw new EngineError(404, 'NOT_FOUND', `Product '${productId}' was not found.`)
  }
  const wishlists = db.wishlists
  const entries = wishlists[user.id] ?? []
  if (entries.some((e) => e.productId === productId)) {
    throw new EngineError(409, 'ALREADY_IN_WISHLIST', 'This product is already in your wishlist.')
  }
  const entry = { productId, addedAt: nowIso() }
  wishlists[user.id] = [...entries, entry]
  db.wishlists = wishlists
  return entry
}

export function removeFromWishlist(token: string | null, productId: string): void {
  const user = requireUser(token)
  const wishlists = db.wishlists
  wishlists[user.id] = (wishlists[user.id] ?? []).filter((e) => e.productId !== productId)
  db.wishlists = wishlists
}
