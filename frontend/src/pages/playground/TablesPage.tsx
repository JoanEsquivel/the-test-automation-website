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
        what="The 24 seed products in a real sortable, paginated table, next to a div-grid impostor and a table with cells you can edit."
        how="Sort by clicking the Product or Price header and watch aria-sort flip on the header cell. Page through with Prev/Next. In the editable table, double-click a Stock cell and commit with Enter. Assert on the first row and on the Last edit readout."
      />
      <DifficultySelector />

      <WidgetSection
        title="Table"
        description="getByRole('table') and row and cell queries only work against the semantic one. The div grid leaves you doing CSS-class archaeology, which is the whole point of it being here."
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
            No rows, no cells, no headers as far as the accessibility tree is concerned. A screen
            reader and a role-based locator both see a pile of generic boxes.
          </p>
        </VariantCard>
        <VariantCard name="Editable cells (double-click)" verdict="advanced">
          <EditableTable />
        </VariantCard>
      </WidgetSection>
    </div>
  )
}
