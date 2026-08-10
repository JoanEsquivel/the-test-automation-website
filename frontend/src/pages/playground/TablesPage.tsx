import productsJson from '@seed/products.json'
import { PageIntro } from '@/components/ui/PageIntro'
import { DifficultySelector } from '@/playground/DifficultySelector'
import { EditableTable } from '@/pages/playground/widgets/tables/EditableTable'
import { SortableProductTable } from '@/pages/playground/widgets/tables/SortableProductTable'
import { VariantCard, WidgetSection } from '@/pages/playground/widgets/WidgetChrome'

interface SeedProduct {
  id: string
  name: string
  category: string
  price: number
}

const FAKE_ROWS = (productsJson as SeedProduct[]).slice(0, 5)

/** Anti-pattern: a "table" made of divs — zero table semantics, brittle locators. */
function FakeGridTable() {
  return (
    <div className="grid-table text-sm">
      <div className="grid grid-cols-3 gap-2 border-b border-ink-600 pb-2 text-xs font-semibold uppercase tracking-wide text-mist-400">
        <div>Product</div>
        <div>Category</div>
        <div>Price</div>
      </div>
      {FAKE_ROWS.map((product) => (
        <div key={product.id} className="grid grid-cols-3 gap-2 border-b border-ink-800 py-2">
          <div className="truncate">{product.name}</div>
          <div className="capitalize text-mist-400">{product.category}</div>
          <div className="font-mono text-volt-300">${product.price.toFixed(2)}</div>
        </div>
      ))}
    </div>
  )
}

export default function TablesPage() {
  return (
    <div>
      <PageIntro
        title="Tables"
        what="The 24 seed products in a real, sortable, paginated table — next to a div-grid impostor and a spreadsheet-style editable table."
        how="Click the Product or Price headers to sort (watch aria-sort), page through with Prev/Next, then double-click a Stock cell in the editable table and commit with Enter. Assert against the first row and the Last edit readout."
      />
      <DifficultySelector />

      <WidgetSection
        title="Table"
        description="getByRole('table') and row/cell queries only work on the semantic one. The div grid forces you into CSS-class archaeology — that is its lesson."
        columns="lg:grid-cols-2"
      >
        <VariantCard
          name="<table> + aria-sort + pagination"
          verdict="recommended"
          className="lg:col-span-2"
        >
          <SortableProductTable />
        </VariantCard>
        <VariantCard name="Div-grid fake table" verdict="antiPattern">
          <FakeGridTable />
          <p className="text-xs text-mist-500">
            No rows, no cells, no headers as far as the accessibility tree is concerned. Screen
            readers and role-based locators see a pile of generic boxes.
          </p>
        </VariantCard>
        <VariantCard name="Editable cells (double-click)" verdict="advanced">
          <EditableTable />
        </VariantCard>
      </WidgetSection>
    </div>
  )
}
