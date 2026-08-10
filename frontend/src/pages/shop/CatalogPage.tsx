import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { api } from '@/api/client'
import { errorMessage } from '@/api/errorMessage'
import type { Category, Page, Product } from '@/api/types'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { PageIntro } from '@/components/ui/PageIntro'
import { useToast } from '@/components/ui/Toast'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'
import { useAuthStore } from '@/stores/auth'
import { CatalogFilters, parseSort } from './components/CatalogFilters'
import { ProductCard } from './components/ProductCard'
import { ProductGridSkeleton } from './components/Skeletons'

const PAGE_SIZE = 12
const SEARCH_DEBOUNCE_MS = 300

export default function CatalogPage() {
  const [params, setParams] = useSearchParams()
  const search = params.get('search') ?? ''
  const category = params.get('category') ?? ''
  const sort = parseSort(params.get('sort'))
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1)

  const [term, setTerm] = useState(search)
  const [result, setResult] = useState<Page<Product> | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addingId, setAddingId] = useState<string | null>(null)

  const token = useAuthStore((state) => state.token)
  const { addItem } = useCart()
  const { wishlistIds, wishlistBusyId, toggleWishlist } = useWishlist()
  const toast = useToast()

  // `setParams` is not guaranteed to be referentially stable; keeping it in a
  // ref stops the debounce timer from being reset on unrelated re-renders.
  const setParamsRef = useRef(setParams)
  useEffect(() => {
    setParamsRef.current = setParams
  })

  const patchParams = useCallback(
    (patch: Record<string, string>, options: { resetPage?: boolean; replace?: boolean } = {}) => {
      const { resetPage = true, replace = false } = options
      setParamsRef.current(
        (previous) => {
          const next = new URLSearchParams(previous)
          for (const [key, value] of Object.entries(patch)) {
            if (value === '') next.delete(key)
            else next.set(key, value)
          }
          if (resetPage) next.delete('page')
          return next
        },
        { replace },
      )
    },
    [],
  )

  // Debounced search → URL (the URL is the single source of truth).
  useEffect(() => {
    if (term === search) return
    const timer = window.setTimeout(() => patchParams({ search: term }, { replace: true }), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [term, search, patchParams])

  // Keep the box in sync when the URL changes from elsewhere (deep link, reset).
  useEffect(() => {
    setTerm((current) => (current === search ? current : search))
  }, [search])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    api.catalog
      .products({ search, category, sort, page, pageSize: PAGE_SIZE })
      .then((response) => {
        if (!active) return
        setResult(response)
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (!active) return
        setError(errorMessage(cause, 'The catalog could not be loaded.'))
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [search, category, sort, page])

  useEffect(() => {
    let active = true
    api.catalog
      .categories()
      .then((list) => {
        if (active) setCategories(list)
      })
      .catch(() => {
        // Filters are progressive enhancement: the grid still works without them.
      })
    return () => {
      active = false
    }
  }, [])

  async function handleAddToCart(product: Product) {
    setAddingId(product.id)
    try {
      await addItem(product.id, 1)
      toast({ tone: 'success', message: `${product.name} added to your cart.` })
    } catch (cause) {
      toast({ tone: 'danger', message: errorMessage(cause, 'The product could not be added.') })
    } finally {
      setAddingId(null)
    }
  }

  async function handleToggleWishlist(product: Product) {
    try {
      const outcome = await toggleWishlist(product.id)
      toast({
        tone: 'success',
        message: outcome === 'added' ? `${product.name} saved to your wishlist.` : `${product.name} removed from your wishlist.`,
      })
    } catch (cause) {
      toast({ tone: 'danger', message: errorMessage(cause, 'The wishlist could not be updated.') })
    }
  }

  const items = result?.items ?? []
  const totalPages = result?.totalPages ?? 1
  const hasFilters = search !== '' || category !== ''

  return (
    <div className="space-y-8">
      <PageIntro
        title="Catalog"
        what="The storefront: 24 seeded products you can search, filter by category, sort and page through. Every card exposes its price, rating, stock state and an add-to-cart button."
        how="Type in the search box (it debounces for 300 ms), pick a category chip, change the sort order or page. All four live in the URL — copy it to build deep-linked, repeatable tests."
      />

      <CatalogFilters
        term={term}
        onTermChange={setTerm}
        sort={sort}
        onSortChange={(value) => patchParams({ sort: value })}
        category={category}
        categories={categories}
        onCategoryChange={(value) => patchParams({ category: value })}
      />

      {error && (
        <Banner tone="danger" data-testid="catalog-error">
          {error}
        </Banner>
      )}

      <section aria-label="Products" className="space-y-5">
        <p data-testid="catalog-result-count" className="text-sm text-mist-400" aria-live="polite">
          {loading ? 'Loading products…' : `${result?.total ?? 0} product(s) found`}
        </p>

        {loading && <ProductGridSkeleton count={PAGE_SIZE} />}

        {!loading && items.length === 0 && !error && (
          <div
            data-testid="empty-results"
            className="rounded-2xl border border-dashed border-ink-600 bg-ink-900 p-10 text-center"
          >
            <p aria-hidden="true" className="text-4xl">
              🔍
            </p>
            <h2 className="font-display mt-3 text-lg font-bold">No products match your filters</h2>
            <p className="mt-1 text-sm text-mist-400">
              Try a shorter search term or a different category.
            </p>
            {hasFilters && (
              <Button
                variant="secondary"
                className="mt-4"
                data-testid="clear-filters"
                onClick={() => patchParams({ search: '', category: '' })}
              >
                Clear all filters
              </Button>
            )}
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                adding={addingId === product.id}
                onAddToCart={handleAddToCart}
                showWishlist={Boolean(token)}
                wishlisted={wishlistIds.has(product.id)}
                wishlistBusy={wishlistBusyId === product.id}
                onToggleWishlist={handleToggleWishlist}
              />
            ))}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <nav
            aria-label="Catalog pagination"
            data-testid="catalog-pagination"
            className="flex items-center justify-center gap-4"
          >
            <Button
              variant="secondary"
              data-testid="pagination-prev"
              disabled={page <= 1}
              onClick={() => patchParams({ page: String(page - 1) }, { resetPage: false })}
            >
              ← Previous
            </Button>
            <span data-testid="pagination-status" className="text-sm font-medium text-mist-300">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              data-testid="pagination-next"
              disabled={page >= totalPages}
              onClick={() => patchParams({ page: String(page + 1) }, { resetPage: false })}
            >
              Next →
            </Button>
          </nav>
        )}
      </section>
    </div>
  )
}
