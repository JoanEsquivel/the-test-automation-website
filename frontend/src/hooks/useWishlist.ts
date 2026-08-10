/** Wishlist membership for the current user, shared by the catalog, the product
 * detail page and the wishlist page. Anonymous visitors get an empty set and no
 * requests are made. */

import { useCallback, useEffect, useState } from 'react'

import { api } from '@/api/client'
import { useAuthStore } from '@/stores/auth'

export function useWishlist() {
  const token = useAuthStore((state) => state.token)
  const [productIds, setProductIds] = useState<Set<string>>(new Set())
  const [busyId, setBusyId] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!token) {
      setProductIds(new Set())
      return
    }
    const { items } = await api.wishlist.list()
    setProductIds(new Set(items.map((entry) => entry.product.id)))
  }, [token])

  useEffect(() => {
    reload().catch(() => {
      // A failed wishlist read must never break browsing.
    })
  }, [reload])

  /** Adds or removes, returning what happened so callers can toast precisely. */
  const toggle = useCallback(
    async (productId: string): Promise<'added' | 'removed'> => {
      const wasSaved = productIds.has(productId)
      setBusyId(productId)
      try {
        if (wasSaved) {
          await api.wishlist.remove(productId)
        } else {
          await api.wishlist.add(productId)
        }
        setProductIds((current) => {
          const next = new Set(current)
          if (wasSaved) next.delete(productId)
          else next.add(productId)
          return next
        })
        return wasSaved ? 'removed' : 'added'
      } finally {
        setBusyId(null)
      }
    },
    [productIds],
  )

  return { wishlistIds: productIds, wishlistBusyId: busyId, toggleWishlist: toggle, reloadWishlist: reload }
}
