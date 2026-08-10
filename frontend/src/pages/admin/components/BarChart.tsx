/** Horizontal bar chart for "magnitude per category", drawn as inline SVG.
 *
 * No charting library: the marks are plain <rect>s, the category names are
 * direct labels (identity is never colour-alone) and the same numbers are
 * repeated in an adjacent <table> so they stay readable and assertable.
 */

export interface ChartRow {
  key: string
  label: string
  value: number
  display: string
}

interface BarChartProps {
  title: string
  description: string
  measureLabel: string
  rows: ChartRow[]
  chartTestId: string
  tableTestId: string
  rowTestId: (row: ChartRow) => string
}

const ROW_HEIGHT = 36
const TRACK_WIDTH = 320

export function BarChart({
  title,
  description,
  measureLabel,
  rows,
  chartTestId,
  tableTestId,
  rowTestId,
}: BarChartProps) {
  const max = Math.max(...rows.map((row) => row.value), 1)
  const height = Math.max(rows.length * ROW_HEIGHT, ROW_HEIGHT)

  return (
    <figure className="rounded-2xl border border-ink-700 bg-ink-900 p-6">
      <figcaption>
        <h2 className="font-display text-base font-bold text-mist-50">{title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-mist-400">{description}</p>
      </figcaption>

      <svg
        role="img"
        aria-label={title}
        data-testid={chartTestId}
        viewBox={`0 0 ${TRACK_WIDTH} ${height}`}
        preserveAspectRatio="none"
        className="mt-5 h-auto w-full"
      >
        <title>{title}</title>
        {rows.map((row, index) => {
          const top = index * ROW_HEIGHT
          const width = Math.max((row.value / max) * TRACK_WIDTH, row.value > 0 ? 4 : 0)
          return (
            <g key={row.key}>
              <text x={0} y={top + 11} className="fill-mist-300 text-[11px] font-medium">
                {row.label}
              </text>
              <text
                x={TRACK_WIDTH}
                y={top + 11}
                textAnchor="end"
                className="fill-mist-200 text-[11px] font-semibold tabular-nums"
              >
                {row.display}
              </text>
              <rect x={0} y={top + 18} width={TRACK_WIDTH} height={8} rx={4} className="fill-ink-700" />
              <rect x={0} y={top + 18} width={width} height={8} rx={4} className="fill-volt-500" />
            </g>
          )
        })}
      </svg>

      <p className="mt-4 flex items-center gap-2 text-xs text-mist-400">
        <span aria-hidden="true" className="inline-block size-2.5 rounded-sm bg-volt-500" />
        {measureLabel}
      </p>

      <table data-testid={tableTestId} className="mt-3 w-full text-left text-sm">
        <caption className="sr-only">{`${title} — ${description}`}</caption>
        <thead className="text-xs uppercase tracking-widest text-mist-500">
          <tr>
            <th scope="col" className="py-1.5 font-semibold">
              Category
            </th>
            <th scope="col" className="py-1.5 text-right font-semibold">
              {measureLabel}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-800">
          {rows.map((row) => (
            <tr key={row.key} data-testid={rowTestId(row)}>
              <th scope="row" className="py-1.5 font-medium text-mist-200">
                {row.label}
              </th>
              <td className="py-1.5 text-right tabular-nums text-mist-300">{row.display}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
