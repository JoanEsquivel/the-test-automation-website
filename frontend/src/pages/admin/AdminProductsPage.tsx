import { useCallback, useEffect, useState } from 'react'

import { api } from '@/api/client'
import { errorMessage } from '@/api/errorMessage'
import type { Category, Product } from '@/api/types'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PageIntro } from '@/components/ui/PageIntro'
import { useToast } from '@/components/ui/Toast'
import { ListSkeleton } from '@/pages/shop/components/Skeletons'
import { formatMoney } from '@/pages/shop/format'
import { AdminNav } from './AdminNav'
import { ProductFormModal } from './components/ProductFormModal'
import type { ProductFormValues } from './components/ProductFormModal'

const PAGE_SIZE = 12
const SEARCH_DEBOUNCE_MS = 300

/** `null` means "create"; a product means "edit"; `undefined` means the modal is closed. */
type EditorTarget = Product | null | undefined

export default function AdminProductsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editorTarget, setEditorTarget] = useState<EditorTarget>(undefined)
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null)
  const toast = useToast()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    api.catalog
      .categories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await api.admin.products({ search: debouncedSearch, page, pageSize: PAGE_SIZE })
      setProducts(result.items)
      setTotal(result.total)
      setTotalPages(result.totalPages)
      setError(null)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSubmit(values: ProductFormValues) {
    setBusy(true)
    try {
      if (editorTarget) {
        await api.admin.updateProduct(editorTarget.id, values)
        toast({ tone: 'success', message: `“${values.name}” updated.` })
      } else {
        await api.admin.createProduct(values)
        toast({ tone: 'success', message: `“${values.name}” created and live in the catalog.` })
      }
      setEditorTarget(undefined)
      await load()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return
    setBusy(true)
    try {
      await api.admin.deleteProduct(pendingDelete.id)
      toast({ tone: 'success', message: `“${pendingDelete.name}” deleted.` })
      setPendingDelete(null)
      await load()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageIntro
        title="Admin · Products"
        what="The whole catalog, admin only, including the out-of-stock items customers never see listed."
        how="Search, page through, then create, edit or delete. Every change goes through the same /api/admin/products endpoints your API tests can hit directly, and the storefront reflects it on the next load."
      />
      <AdminNav />

      {error && (
        <Banner tone="danger" data-testid="admin-products-error" onDismiss={() => setError(null)}>
          {error}
        </Banner>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <label htmlFor="admin-product-search" className="mb-1.5 block text-sm font-medium text-mist-200">
            Search products
          </label>
          <input
            id="admin-product-search"
            data-testid="admin-product-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name…"
            className="w-64 rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-mist-50 placeholder:text-mist-500 focus:border-volt-400 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-mist-400">
            <span data-testid="admin-products-count" className="font-semibold text-mist-100">
              {total}
            </span>{' '}
            product{total === 1 ? '' : 's'}
          </p>
          <Button data-testid="create-product" onClick={() => setEditorTarget(null)}>
            New product
          </Button>
        </div>
      </div>

      {loading ? (
        <ListSkeleton rows={PAGE_SIZE} testId="admin-products-skeleton" />
      ) : products.length === 0 ? (
        <p data-testid="admin-products-empty" className="rounded-2xl border border-ink-700 bg-ink-900 p-8 text-center text-sm text-mist-400">
          No products match “{debouncedSearch}”.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink-700 bg-ink-900">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <caption className="sr-only">Product catalog with edit and delete actions</caption>
            <thead className="border-b border-ink-700 text-xs uppercase tracking-wider text-mist-400">
              <tr>
                <th scope="col" className="px-4 py-3">Product</th>
                <th scope="col" className="px-4 py-3">Category</th>
                <th scope="col" className="px-4 py-3 text-right">Price</th>
                <th scope="col" className="px-4 py-3 text-right">Stock</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {products.map((product) => (
                <tr key={product.id} data-testid={`admin-product-row-${product.id}`} className="hover:bg-ink-800/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-mist-50">
                      <span aria-hidden="true" className="mr-2 text-xl">
                        {product.imageEmoji}
                      </span>
                      {product.name}
                    </p>
                    <p className="ml-8 font-mono text-xs text-mist-500">{product.id}</p>
                  </td>
                  <td className="px-4 py-3 text-mist-300">{product.category}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-mist-100">{formatMoney(product.price)}</td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums ${product.stock === 0 ? 'text-red-300' : 'text-mist-100'}`}
                  >
                    {product.stock}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      data-testid={`edit-product-${product.id}`}
                      onClick={() => setEditorTarget(product)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      className="ml-2"
                      data-testid={`delete-product-${product.id}`}
                      onClick={() => setPendingDelete(product)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <nav
        aria-label="Product table pagination"
        data-testid="admin-products-pagination"
        className="flex items-center justify-between gap-3"
      >
        <Button
          size="sm"
          variant="secondary"
          data-testid="admin-products-prev"
          disabled={page <= 1}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
        >
          Previous
        </Button>
        <p className="text-sm text-mist-400">
          Page <span className="font-semibold text-mist-100">{page}</span> of {totalPages}
        </p>
        <Button
          size="sm"
          variant="secondary"
          data-testid="admin-products-next"
          disabled={page >= totalPages}
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
        >
          Next
        </Button>
      </nav>

      {editorTarget !== undefined && (
        <ProductFormModal
          product={editorTarget}
          categories={categories}
          busy={busy}
          onSubmit={handleSubmit}
          onClose={() => setEditorTarget(undefined)}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={`Delete “${pendingDelete.name}”?`}
          message="It disappears from the storefront right away. Reset the demo data to get the seed catalog back."
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}
