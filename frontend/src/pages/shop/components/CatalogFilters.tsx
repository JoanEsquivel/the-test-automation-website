import type { Category, ProductQuery } from '@/api/types'

export type Sort = NonNullable<ProductQuery['sort']>

/** The six sort options of the API contract, in the order the select shows them. */
export const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
  { value: 'rating-desc', label: 'Rating: high to low' },
]

export function parseSort(raw: string | null): Sort {
  const match = SORT_OPTIONS.find((option) => option.value === raw)
  return match ? match.value : 'newest'
}

interface CatalogFiltersProps {
  term: string
  onTermChange: (term: string) => void
  sort: Sort
  onSortChange: (sort: string) => void
  category: string
  categories: Category[]
  onCategoryChange: (categoryId: string) => void
}

function chipClass(active: boolean): string {
  return `rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
    active
      ? 'border-volt-500/60 bg-volt-500/15 text-volt-200'
      : 'border-ink-600 bg-ink-800 text-mist-300 hover:text-mist-50'
  }`
}

/** Search box, sort select and category chips. Every control writes straight
 * into the URL through the callbacks, so the page state is always shareable. */
export function CatalogFilters({
  term,
  onTermChange,
  sort,
  onSortChange,
  category,
  categories,
  onCategoryChange,
}: CatalogFiltersProps) {
  return (
    <section aria-label="Catalog filters" className="space-y-4 rounded-2xl border border-ink-700 bg-ink-900 p-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <label htmlFor="catalog-search" className="mb-1.5 block text-sm font-medium text-mist-200">
            Search products
          </label>
          <input
            id="catalog-search"
            data-testid="catalog-search"
            type="search"
            value={term}
            onChange={(event) => onTermChange(event.target.value)}
            placeholder="Try “wireless”, “keyboard” or “hub”…"
            className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-mist-50 placeholder:text-mist-500 focus:border-volt-400 focus:outline-none"
          />
          <p className="mt-1 text-xs text-mist-500">Debounced by 300 ms, then written to the URL.</p>
        </div>
        <div>
          <label htmlFor="catalog-sort" className="mb-1.5 block text-sm font-medium text-mist-200">
            Sort by
          </label>
          <select
            id="catalog-sort"
            data-testid="catalog-sort"
            value={sort}
            onChange={(event) => onSortChange(event.target.value)}
            className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-mist-50 focus:border-volt-400 focus:outline-none sm:w-56"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p id="category-chips-label" className="mb-2 text-sm font-medium text-mist-200">
          Categories
        </p>
        <div role="group" aria-labelledby="category-chips-label" className="flex flex-wrap gap-2">
          <button
            type="button"
            data-testid="category-chip-all"
            aria-pressed={category === ''}
            onClick={() => onCategoryChange('')}
            className={chipClass(category === '')}
          >
            All products
          </button>
          {categories.map((entry) => (
            <button
              key={entry.id}
              type="button"
              data-testid={`category-chip-${entry.id}`}
              aria-pressed={category === entry.id}
              onClick={() => onCategoryChange(category === entry.id ? '' : entry.id)}
              className={chipClass(category === entry.id)}
            >
              <span aria-hidden="true">{entry.emoji}</span> {entry.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
