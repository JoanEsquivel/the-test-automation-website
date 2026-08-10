/** The single place the UI talks to `api.cart`.
 *
 * Responsibilities:
 * - guarantees a cart identity exists (guests get an `X-Cart-Id` cart created once);
 * - keeps `useCartStore.itemCount` (the header badge) in sync with every response;
 * - `addItem` bumps the badge OPTIMISTICALLY and rolls back when the request fails
 *   (realism requirement in docs/02-specs/ecommerce-spec.md).
 *
 * Mutations resolve with the fresh cart and reject with the original `ApiError`,
 * so pages can toast the exact contract message.
 */

import { useCallback, useEffect, useState } from 'react'

import { api } from '@/api/client'
import { errorMessage } from '@/api/errorMessage'
import type { Cart } from '@/api/types'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'

export function countItems(cart: Cart): number {
  return cart.items.reduce((total, item) => total + item.qty, 0)
}

/** Shared across components so two mounts never create two guest carts. */
let pendingCartCreation: Promise<string> | null = null

export async function ensureCartIdentity(): Promise<void> {
  if (useAuthStore.getState().token) return
  if (useCartStore.getState().cartId) return
  pendingCartCreation ??= api.cart.create().then(({ cartId }) => {
    useCartStore.getState().setCartId(cartId)
    return cartId
  })
  try {
    await pendingCartCreation
  } finally {
    pendingCartCreation = null
  }
}

/** Called right after login/registration: the token now identifies the cart
 * (the API merged any guest cart sent with `X-Cart-Id`), so the guest id is
 * dropped and the header badge is refreshed from the server. */
export async function adoptUserCart(): Promise<void> {
  useCartStore.getState().setCartId(null)
  try {
    useCartStore.getState().setItemCount(countItems(await api.cart.get()))
  } catch {
    // A failed refresh must never block the redirect after a successful login.
    useCartStore.getState().setItemCount(0)
  }
}

export interface UseCartOptions {
  /** Load the cart as soon as the component mounts (cart / checkout pages). */
  autoLoad?: boolean
}

export function useCart({ autoLoad = false }: UseCartOptions = {}) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(autoLoad)
  const [error, setError] = useState<string | null>(null)
  const setItemCount = useCartStore((state) => state.setItemCount)

  const apply = useCallback(
    (fresh: Cart) => {
      setCart(fresh)
      setItemCount(countItems(fresh))
      return fresh
    },
    [setItemCount],
  )

  const loadCart = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await ensureCartIdentity()
      apply(await api.cart.get())
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setLoading(false)
    }
  }, [apply])

  /** Wraps a mutation: ensure identity, run it, publish the fresh cart. */
  const mutate = useCallback(
    async (run: () => Promise<Cart>) => {
      setError(null)
      await ensureCartIdentity()
      try {
        return apply(await run())
      } catch (cause) {
        setError(errorMessage(cause))
        throw cause
      }
    },
    [apply],
  )

  const addItem = useCallback(
    async (productId: string, qty = 1) => {
      const previousCount = useCartStore.getState().itemCount
      setItemCount(previousCount + qty) // optimistic badge bump
      try {
        return await mutate(() => api.cart.addItem(productId, qty))
      } catch (cause) {
        setItemCount(previousCount) // rollback
        throw cause
      }
    },
    [mutate, setItemCount],
  )

  const updateItem = useCallback(
    (productId: string, qty: number) => mutate(() => api.cart.updateItem(productId, qty)),
    [mutate],
  )

  const removeItem = useCallback(
    (productId: string) => mutate(() => api.cart.removeItem(productId)),
    [mutate],
  )

  const applyCoupon = useCallback((code: string) => mutate(() => api.cart.applyCoupon(code)), [mutate])

  const removeCoupon = useCallback(() => mutate(() => api.cart.removeCoupon()), [mutate])

  useEffect(() => {
    if (autoLoad) void loadCart()
  }, [autoLoad, loadCart])

  return { cart, loading, error, loadCart, addItem, updateItem, removeItem, applyCoupon, removeCoupon }
}
