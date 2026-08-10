import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { api } from '@/api/client'
import { errorMessage } from '@/api/errorMessage'
import type { Product, WishlistEntry } from '@/api/types'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { PageIntro } from '@/components/ui/PageIntro'
import { useToast } from '@/components/ui/Toast'
import { useCart } from '@/hooks/useCart'
import { ProductGridSkeleton } from './components/Skeletons'
import { StarRating } from './components/StarRating'
import { StockBadge } from './components/StockBadge'
import { formatMoney } from './format'

export default function WishlistPage() {
  const [entries, setEntries] = useState<WishlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const { addItem } = useCart()
  const toast = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { items } = await api.wishlist.list()
      setEntries(items)
    } catch (cause) {
      setError(errorMessage(cause, 'Your wishlist could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleMoveToCart(product: Product) {
    setBusyId(product.id)
    try {
      await addItem(product.id, 1)
      await api.wishlist.remove(product.id)
      setEntries((current) => current.filter((entry) => entry.product.id !== product.id))
      toast({ tone: 'success', message: `${product.name} moved to your cart.` })
    } catch (cause) {
      toast({ tone: 'danger', message: errorMessage(cause, 'The product could not be moved to your cart.') })
    } finally {
      setBusyId(null)
    }
  }

  async function handleRemove(product: Product) {
    setBusyId(product.id)
    try {
      await api.wishlist.remove(product.id)
      setEntries((current) => current.filter((entry) => entry.product.id !== product.id))
      toast({ tone: 'success', message: `${product.name} removed from your wishlist.` })
    } catch (cause) {
      toast({ tone: 'danger', message: errorMessage(cause, 'The product could not be removed.') })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-8">
      <PageIntro
        title="Wishlist"
        what="Everything you have hearted, stored per account and served by GET /api/wishlist. Each card moves straight to the cart or drops off the list."
        how="Heart products from the catalog or a product page, then come back. “Move to cart” adds one unit and removes the entry: two requests, one click, and both need asserting."
      />

      {error && (
        <Banner tone="danger" data-testid="wishlist-error">
          {error}
        </Banner>
      )}

      {loading && <ProductGridSkeleton count={3} />}

      {!loading && entries.length === 0 && !error && (
        <div
          data-testid="empty-wishlist"
          className="rounded-2xl border border-dashed border-ink-600 bg-ink-900 p-10 text-center"
        >
          <p aria-hidden="true" className="text-4xl">
            ♡
          </p>
          <h2 className="font-display mt-3 text-lg font-bold">Your wishlist is empty</h2>
          <p className="mt-1 text-sm text-mist-400">Hit the heart on any product card to save it here.</p>
          <Link
            to="/shop/catalog"
            data-testid="wishlist-catalog-link"
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-volt-500 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-volt-400"
          >
            Browse the catalog
          </Link>
        </div>
      )}

      {!loading && entries.length > 0 && (
        <section aria-label="Saved products" className="space-y-5">
          <p data-testid="wishlist-count" className="text-sm text-mist-400" aria-live="polite">
            {entries.length} product(s) saved
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map(({ product }) => (
              <article
                key={product.id}
                data-testid={`wishlist-item-${product.id}`}
                className="flex flex-col rounded-2xl border border-ink-700 bg-ink-900 p-5"
              >
                <Link
                  to={`/shop/product/${product.id}`}
                  className="grid size-16 place-items-center rounded-xl bg-ink-800 text-4xl"
                  aria-label={`View ${product.name}`}
                >
                  <span aria-hidden="true">{product.imageEmoji}</span>
                </Link>

                <h2 className="font-display mt-4 text-base font-semibold leading-snug">
                  <Link
                    to={`/shop/product/${product.id}`}
                    data-testid={`wishlist-name-${product.id}`}
                    className="line-clamp-2 break-words hover:text-volt-300"
                  >
                    {product.name}
                  </Link>
                </h2>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="font-display text-lg font-bold text-mist-50">{formatMoney(product.price)}</span>
                  <StarRating value={product.rating} />
                </div>

                <div className="mt-3">
                  <StockBadge stock={product.stock} productId={product.id} />
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <Button
                    data-testid={`move-to-cart-${product.id}`}
                    disabled={product.stock === 0 || busyId === product.id}
                    onClick={() => handleMoveToCart(product)}
                  >
                    {product.stock === 0 ? 'Out of stock' : busyId === product.id ? 'Moving…' : 'Move to cart'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-300 hover:text-red-200"
                    data-testid={`remove-from-wishlist-${product.id}`}
                    disabled={busyId === product.id}
                    onClick={() => handleRemove(product)}
                  >
                    Remove
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
