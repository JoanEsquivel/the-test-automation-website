import type { ReactNode } from 'react'

interface StatTileProps {
  label: string
  value: string
  hint: ReactNode
  'data-testid': string
}

/** One headline number. No chart: a single value reads faster as a tile. */
export function StatTile({ label, value, hint, ...rest }: StatTileProps) {
  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-900 p-5" {...rest}>
      <p className="text-xs font-semibold uppercase tracking-widest text-mist-500">{label}</p>
      <p className="font-display mt-2 text-3xl font-bold tabular-nums text-mist-50">{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-mist-400">{hint}</p>
    </div>
  )
}
