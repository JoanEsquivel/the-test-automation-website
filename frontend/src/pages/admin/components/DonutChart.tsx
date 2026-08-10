/** Donut chart for "share of a whole", drawn as inline SVG stroke arcs.
 *
 * Palette: the five order states get reserved status hues, validated against the
 * ink-900 surface for lightness band, chroma, CVD separation and contrast. The
 * weakest adjacent pair sits in the CVD floor band, so identity carries three
 * secondary encodings: a 2px surface gap between segments, a labelled legend and
 * the data table below.
 */

import type { ChartRow } from './BarChart'

interface DonutChartProps {
  title: string
  description: string
  measureLabel: string
  rows: ChartRow[]
  colors: Record<string, string>
  chartTestId: string
  tableTestId: string
  rowTestId: (row: ChartRow) => string
  categoryHeader: string
}

const RADIUS = 40
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const GAP = 2

export function DonutChart({
  title,
  description,
  measureLabel,
  rows,
  colors,
  chartTestId,
  tableTestId,
  rowTestId,
  categoryHeader,
}: DonutChartProps) {
  const total = rows.reduce((sum, row) => sum + row.value, 0)
  let offset = 0

  return (
    <figure className="rounded-2xl border border-ink-700 bg-ink-900 p-6">
      <figcaption>
        <h2 className="font-display text-base font-bold text-mist-50">{title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-mist-400">{description}</p>
      </figcaption>

      <div className="mt-5 flex flex-wrap items-center gap-6">
        <svg
          role="img"
          aria-label={title}
          data-testid={chartTestId}
          viewBox="0 0 120 120"
          className="size-36 shrink-0"
        >
          <title>{title}</title>
          <circle cx={60} cy={60} r={RADIUS} fill="none" strokeWidth={16} className="stroke-ink-700" />
          {total > 0 &&
            rows.map((row) => {
              const length = (row.value / total) * CIRCUMFERENCE
              const dash = Math.max(length - GAP, 0.5)
              const segment = (
                <circle
                  key={row.key}
                  cx={60}
                  cy={60}
                  r={RADIUS}
                  fill="none"
                  strokeWidth={16}
                  stroke={colors[row.key] ?? '#2b3a5e'}
                  strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 60 60)"
                />
              )
              offset += length
              return segment
            })}
          <text
            x={60}
            y={58}
            textAnchor="middle"
            className="fill-mist-50 text-[18px] font-bold tabular-nums"
          >
            {total}
          </text>
          <text x={60} y={72} textAnchor="middle" className="fill-mist-400 text-[9px] uppercase">
            orders
          </text>
        </svg>

        <ul data-testid={`${chartTestId}-legend`} className="min-w-40 flex-1 space-y-1.5 text-sm">
          {rows.map((row) => (
            <li key={row.key} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="inline-block size-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: colors[row.key] ?? '#2b3a5e' }}
              />
              <span className="flex-1 text-mist-300">{row.label}</span>
              <span className="font-semibold tabular-nums text-mist-100">{row.display}</span>
            </li>
          ))}
        </ul>
      </div>

      <table data-testid={tableTestId} className="mt-5 w-full text-left text-sm">
        <caption className="sr-only">{`${title} — ${description}`}</caption>
        <thead className="text-xs uppercase tracking-widest text-mist-500">
          <tr>
            <th scope="col" className="py-1.5 font-semibold">
              {categoryHeader}
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
