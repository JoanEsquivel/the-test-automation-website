import { useMemo, useState } from 'react'

import productsJson from '@seed/products.json'
import { useLocatorAttrs, withClass } from '@/playground/locators'

interface SeedProduct {
  id: string
  name: string
  category: string
  price: number
  stock: number
  imageEmoji: string
}

const PRODUCTS = productsJson as SeedProduct[]
const PAGE_SIZE = 8

type SortKey = 'name' | 'price'
type SortDir = 'asc' | 'desc'

function compare(a: SeedProduct, b: SeedProduct, key: SortKey, dir: SortDir): number {
  const result = key === 'name' ? a.name.localeCompare(b.name) : a.price - b.price
  return dir === 'asc' ? result : -result
}

/** Recommended: a semantic table with aria-sort headers and client pagination. */
export function SortableProductTable() {
  const attrs = useLocatorAttrs()
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(0)

  const pageCount = Math.ceil(PRODUCTS.length / PAGE_SIZE)
  const rows = useMemo(() => {
    const sorted = [...PRODUCTS].sort((a, b) => compare(a, b, sortKey, sortDir))
    return sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  }, [sortKey, sortDir, page])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(0)
  }

  const ariaSort = (key: SortKey) =>
    sortKey === key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined

  const sortIndicator = (key: SortKey) => (sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '')

  return (
    <div className="overflow-x-auto">
      <table
        {...withClass(
          attrs('tables-products', { className: 'products-table' }),
          'w-full border-collapse text-sm',
        )}
      >
        <caption className="mb-2 text-left text-xs font-semibold uppercase tracking-wide text-mist-400">
          Seed products ({PRODUCTS.length} items, {PAGE_SIZE} per page)
        </caption>
        <thead>
          <tr className="border-b border-ink-600 text-left text-xs uppercase tracking-wide text-mist-400">
            <th scope="col" aria-sort={ariaSort('name')} className="py-2 pr-4">
              <button type="button" onClick={() => toggleSort('name')} className="font-semibold hover:text-mist-100">
                Product{sortIndicator('name')}
              </button>
            </th>
            <th scope="col" className="py-2 pr-4">
              Category
            </th>
            <th scope="col" aria-sort={ariaSort('price')} className="py-2 pr-4">
              <button type="button" onClick={() => toggleSort('price')} className="font-semibold hover:text-mist-100">
                Price{sortIndicator('price')}
              </button>
            </th>
            <th scope="col" className="py-2">
              Stock
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((product) => (
            <tr key={product.id} className="border-b border-ink-800 hover:bg-ink-800/50">
              <td className="py-2 pr-4">
                <span aria-hidden="true" className="mr-2">
                  {product.imageEmoji}
                </span>
                {product.name}
              </td>
              <td className="py-2 pr-4 capitalize text-mist-400">{product.category}</td>
              <td className="py-2 pr-4 font-mono text-volt-300">${product.price.toFixed(2)}</td>
              <td className="py-2 text-mist-400">{product.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex items-center justify-between text-sm">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          className="rounded-lg border border-ink-600 bg-ink-800 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Prev
        </button>
        <span className="text-xs text-mist-400">
          Page {page + 1} of {pageCount}
        </span>
        <button
          type="button"
          aria-label="Next page"
          disabled={page === pageCount - 1}
          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          className="rounded-lg border border-ink-600 bg-ink-800 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
