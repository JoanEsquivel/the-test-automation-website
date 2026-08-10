import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { api } from '@/api/client'
import { errorCode, errorMessage } from '@/api/errorMessage'
import type { Product, Review } from '@/api/types'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { PageIntro } from '@/components/ui/PageIntro'
import { useToast } from '@/components/ui/Toast'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'
import { useAuthStore } from '@/stores/auth'
import { QtyStepper } from './components/QtyStepper'
import { ReviewSection } from './components/ReviewSection'
import { DetailSkeleton } from './components/Skeletons'
import { StarRating } from './components/StarRating'
import { StockBadge } from './components/StockBadge'
import { WishlistHeart } from './components/WishlistHeart'
import { formatMoney } from './format'

type TabId = 'description' | 'reviews'

const TABS: { id: TabId; label: string }[] = [
  { id: 'description', label: 'Description' },
  { id: 'reviews', label: 'Reviews' },
]

function averageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0
  const sum = reviews.reduce((total, review) => total + review.rating, 0)
  return Math.round((sum / reviews.length) * 10) / 10
}

export default function ProductDetailPage() {
  const { productId = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState<TabId>('description')
  const [adding, setAdding] = useState(false)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  const token = useAuthStore((state) => state.token)
  const { addItem } = useCart()
  const { wishlistIds, wishlistBusyId, toggleWishlist } = useWishlist()

  const loginHref = `/account/login?returnTo=${encodeURIComponent(`/shop/product/${productId}`)}`

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const [fresh, freshReviews] = await Promise.all([
        api.catalog.product(productId),
        api.catalog.reviews(productId),
      ])
      setProduct(fresh)
      setReviews(freshReviews)
      setQty(1)
    } catch (cause) {
      if (errorCode(cause) === 'NOT_FOUND') setNotFound(true)
      else setError(errorMessage(cause, 'This product could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    void load()
  }, [load])

  const maxQty = Math.min(99, Math.max(product?.stock ?? 0, 0))

  async function handleAddToCart() {
    if (!product) return
    setAdding(true)
    try {
      await addItem(product.id, qty)
      toast({ tone: 'success', message: `${qty} × ${product.name} added to your cart.` })
    } catch (cause) {
      toast({ tone: 'danger', message: errorMessage(cause, 'The product could not be added.') })
    } finally {
      setAdding(false)
    }
  }

  async function handleWishlist() {
    if (!product) return
    if (!token) {
      navigate(loginHref)
      return
    }
    try {
      const outcome = await toggleWishlist(product.id)
      toast({
        tone: 'success',
        message: outcome === 'added' ? 'Saved to your wishlist.' : 'Removed from your wishlist.',
      })
    } catch (cause) {
      toast({ tone: 'danger', message: errorMessage(cause, 'The wishlist could not be updated.') })
    }
  }

  async function handleReviewSubmit(input: { rating: number; title: string; body: string }) {
    setReviewSubmitting(true)
    setReviewError(null)
    try {
      const created = await api.catalog.addReview(productId, input)
      const nextReviews = [created, ...reviews]
      setReviews(nextReviews)
      setProduct((current) => (current ? { ...current, rating: averageRating(nextReviews) } : current))
      toast({ tone: 'success', message: 'Your review was published.' })
    } catch (cause) {
      setReviewError(errorMessage(cause, 'The review could not be published.'))
    } finally {
      setReviewSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <PageIntro
        title="Product detail"
        what="Everything about a single product: price, live stock, average rating, a quantity stepper clamped to the available stock, wishlist control and tabbed description / reviews."
        how="Pick a quantity and add it to the cart, switch tabs with the mouse or the keyboard, and — while logged in — publish a review and watch the average rating update immediately."
      />

      <p>
        <Link to="/shop/catalog" data-testid="back-to-catalog" className="text-sm font-medium text-volt-400 hover:underline">
          ← Back to the catalog
        </Link>
      </p>

      {loading && <DetailSkeleton testId="product-skeleton" />}

      {!loading && notFound && (
        <div data-testid="product-not-found" className="rounded-2xl border border-dashed border-ink-600 bg-ink-900 p-10 text-center">
          <p aria-hidden="true" className="text-4xl">
            🕵️
          </p>
          <h2 className="font-display mt-3 text-xl font-bold">We could not find that product</h2>
          <p className="mt-2 text-sm text-mist-400">
            The id <code className="rounded bg-ink-800 px-1.5 py-0.5 text-volt-300">{productId}</code> does not exist in
            the catalog. It may have been deleted from the admin area.
          </p>
          <Link
            to="/shop/catalog"
            className="mt-5 inline-flex rounded-lg bg-volt-500 px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-volt-400"
          >
            Browse the catalog
          </Link>
        </div>
      )}

      {!loading && error && (
        <Banner tone="danger" data-testid="product-error">
          {error}
        </Banner>
      )}

      {!loading && product && (
        <>
          <section aria-label="Product summary" className="grid gap-8 rounded-3xl border border-ink-700 bg-ink-900 p-6 md:grid-cols-2">
            <div className="grid place-items-center rounded-2xl bg-ink-800 p-10" data-testid="product-gallery">
              <span aria-hidden="true" className="text-[7rem] leading-none">
                {product.imageEmoji}
              </span>
              <span className="sr-only">{product.name}</span>
            </div>

            <div>
              <h2 data-testid="product-name" className="font-display text-2xl font-bold leading-tight">
                {product.name}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <StarRating value={product.rating} reviewCount={reviews.length} size="md" data-testid="product-rating" />
                <StockBadge stock={product.stock} />
              </div>
              <p data-testid="product-price" className="font-display mt-4 text-3xl font-bold text-volt-300">
                {formatMoney(product.price)}
              </p>
              <p data-testid="product-stock" className="mt-1 text-sm text-mist-400">
                {product.stock > 0 ? `${product.stock} in stock` : 'Currently unavailable'}
              </p>

              <div className="mt-6 flex flex-wrap items-end gap-3">
                <QtyStepper
                  value={qty}
                  max={maxQty}
                  disabled={product.stock === 0}
                  onChange={setQty}
                />

                <Button
                  size="lg"
                  data-testid="add-to-cart"
                  disabled={product.stock === 0 || adding}
                  onClick={handleAddToCart}
                >
                  {product.stock === 0 ? 'Out of stock' : adding ? 'Adding…' : 'Add to cart'}
                </Button>

                <WishlistHeart
                  productId={product.id}
                  productName={product.name}
                  active={wishlistIds.has(product.id)}
                  busy={wishlistBusyId === product.id}
                  onToggle={handleWishlist}
                />
              </div>

              <p className="mt-4 text-xs text-mist-500">
                Quantities are clamped between 1 and {Math.max(maxQty, 1)} — the same rule the API enforces.
              </p>
            </div>
          </section>

          <section aria-label="Product information">
            <div role="tablist" aria-label="Product information" className="flex gap-2 border-b border-ink-700">
              {TABS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  role="tab"
                  id={`tab-${entry.id}`}
                  data-testid={`tab-${entry.id}`}
                  aria-selected={tab === entry.id}
                  aria-controls={`tabpanel-${entry.id}`}
                  tabIndex={tab === entry.id ? 0 : -1}
                  onClick={() => setTab(entry.id)}
                  onKeyDown={(event) => {
                    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
                    event.preventDefault()
                    const index = TABS.findIndex((candidate) => candidate.id === tab)
                    const delta = event.key === 'ArrowRight' ? 1 : -1
                    const next = TABS[(index + delta + TABS.length) % TABS.length]
                    setTab(next.id)
                    document.getElementById(`tab-${next.id}`)?.focus()
                  }}
                  className={`-mb-px rounded-t-lg border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
                    tab === entry.id
                      ? 'border-volt-400 text-volt-300'
                      : 'border-transparent text-mist-400 hover:text-mist-100'
                  }`}
                >
                  {entry.label}
                  {entry.id === 'reviews' && ` (${reviews.length})`}
                </button>
              ))}
            </div>

            <div
              role="tabpanel"
              id="tabpanel-description"
              aria-labelledby="tab-description"
              data-testid="tabpanel-description"
              hidden={tab !== 'description'}
              tabIndex={0}
              className="pt-5"
            >
              <p className="max-w-3xl text-sm leading-relaxed text-mist-300">{product.description}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <li key={tag} className="rounded-full border border-ink-600 bg-ink-800 px-3 py-1 text-xs text-mist-300">
                    #{tag}
                  </li>
                ))}
              </ul>
            </div>

            <div
              role="tabpanel"
              id="tabpanel-reviews"
              aria-labelledby="tab-reviews"
              data-testid="tabpanel-reviews"
              hidden={tab !== 'reviews'}
              tabIndex={0}
              className="pt-5"
            >
              <ReviewSection
                reviews={reviews}
                canWrite={Boolean(token)}
                loginHref={loginHref}
                submitting={reviewSubmitting}
                error={reviewError}
                onSubmit={handleReviewSubmit}
              />
            </div>
          </section>
        </>
      )}
    </div>
  )
}
