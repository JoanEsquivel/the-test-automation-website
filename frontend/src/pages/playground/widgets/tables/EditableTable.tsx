import { useEffect, useRef, useState } from 'react'

import { useLocatorAttrs, withClass } from '@/playground/locators'
import { Readout } from '@/pages/playground/widgets/WidgetChrome'

interface InventoryRow {
  id: string
  item: string
  stock: number
}

interface CellEditorProps {
  row: InventoryRow
  onCommit: (row: InventoryRow, raw: string) => void
  onCancel: () => void
  committedRef: { current: boolean }
}

/** Inline editor focused on mount (effect-based to keep autofocus a11y-clean). */
function CellEditor({ row, onCommit, onCancel, committedRef }: CellEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      aria-label={`Stock for ${row.item}`}
      defaultValue={row.stock}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          committedRef.current = true
          onCommit(row, event.currentTarget.value)
        } else if (event.key === 'Escape') {
          committedRef.current = true
          onCancel()
        }
      }}
      onBlur={(event) => {
        if (!committedRef.current) onCommit(row, event.currentTarget.value)
      }}
      className="w-20 rounded border border-volt-500/60 bg-ink-800 px-2 py-0.5 text-sm text-mist-100"
    />
  )
}

const INITIAL_ROWS: InventoryRow[] = [
  { id: 'plugs', item: 'Spark plugs', stock: 12 },
  { id: 'filters', item: 'Oil filters', stock: 8 },
  { id: 'wipers', item: 'Wiper blades', stock: 20 },
  { id: 'bulbs', item: 'Headlight bulbs', stock: 5 },
]

/** Editable-cells table: double-click a Stock cell to edit; Enter or blur commits. */
export function EditableTable() {
  const attrs = useLocatorAttrs()
  const [rows, setRows] = useState(INITIAL_ROWS)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [lastEdit, setLastEdit] = useState('')
  const committedRef = useRef(false)

  const commit = (row: InventoryRow, raw: string) => {
    const next = Number.parseInt(raw, 10)
    if (Number.isNaN(next)) {
      setEditingId(null)
      return
    }
    setRows((current) => current.map((r) => (r.id === row.id ? { ...r, stock: next } : r)))
    setLastEdit(`${row.item}: ${row.stock} → ${next}`)
    setEditingId(null)
  }

  return (
    <div>
      <table className="w-full border-collapse text-sm">
        <caption className="mb-2 text-left text-xs font-semibold uppercase tracking-wide text-mist-400">
          Inventory (double-click Stock to edit)
        </caption>
        <thead>
          <tr className="border-b border-ink-600 text-left text-xs uppercase tracking-wide text-mist-400">
            <th scope="col" className="py-2 pr-4">
              Item
            </th>
            <th scope="col" className="py-2">
              Stock
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-ink-800">
              <td className="py-2 pr-4">{row.item}</td>
              <td
                onDoubleClick={() => {
                  committedRef.current = false
                  setEditingId(row.id)
                }}
                title="Double-click to edit"
                {...withClass(
                  attrs(`tables-edit-cell-${row.id}`, { className: `edit-cell edit-cell--${row.id}` }),
                  'cursor-cell py-2 font-mono text-volt-300',
                )}
              >
                {editingId === row.id ? (
                  <CellEditor
                    row={row}
                    onCommit={commit}
                    onCancel={() => setEditingId(null)}
                    committedRef={committedRef}
                  />
                ) : (
                  row.stock
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3">
        <Readout testId="tables-edit-readout" label="Last edit" value={lastEdit || 'none'} />
      </div>
    </div>
  )
}
