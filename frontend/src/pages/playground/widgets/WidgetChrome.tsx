import type { ReactNode } from 'react'

import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { useLocatorAttrs, withClass } from '@/playground/locators'

/** Verdict badges shown on every variant card. Exactly ONE `recommended` per widget row. */
export const VERDICTS = {
  recommended: { label: 'Recommended', tone: 'success' },
  recommendedSearch: { label: 'Recommended for search', tone: 'success' },
  ariaCustom: { label: 'ARIA custom', tone: 'volt' },
  advanced: { label: 'Advanced pattern', tone: 'pulse' },
  legacy: { label: 'Legacy', tone: 'neutral' },
  antiPattern: { label: 'Anti-pattern', tone: 'warning' },
} as const satisfies Record<string, { label: string; tone: BadgeTone }>

export type Verdict = keyof typeof VERDICTS

interface WidgetSectionProps {
  title: string
  description: string
  /** Tailwind grid columns for the variant cards (default 3-up on desktop). */
  columns?: string
  children: ReactNode
}

/** One widget row: heading + short description + side-by-side variant cards. */
export function WidgetSection({ title, description, columns = 'md:grid-cols-3', children }: WidgetSectionProps) {
  return (
    <section aria-label={title} className="mb-10">
      <h2 className="font-display text-xl font-bold text-mist-50">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-mist-400">{description}</p>
      <div className={`mt-4 grid gap-4 ${columns}`}>{children}</div>
    </section>
  )
}

interface VariantCardProps {
  /** Implementation name, e.g. `<input type="checkbox"> + <label>` */
  name: string
  verdict: Verdict
  className?: string
  children: ReactNode
}

/** One implementation variant of a widget, labeled with its verdict badge. */
export function VariantCard({ name, verdict, className = '', children }: VariantCardProps) {
  const { label, tone } = VERDICTS[verdict]
  return (
    <article className={`flex flex-col rounded-xl border border-ink-700 bg-ink-900/70 p-4 ${className}`}>
      <header className="mb-3 flex items-start justify-between gap-2">
        <h3 className="font-mono text-xs font-semibold leading-relaxed text-mist-300">{name}</h3>
        <Badge tone={tone} className="shrink-0">
          {label}
        </Badge>
      </header>
      <div className="flex flex-1 flex-col gap-3 text-sm text-mist-200">{children}</div>
    </article>
  )
}

interface ReadoutProps {
  /** Stable test id — rendered only at easy difficulty (via useLocatorAttrs). */
  testId: string
  label: string
  value: string
}

/** Visible outcome node so scripts can assert what the widget did. */
export function Readout({ testId, label, value }: ReadoutProps) {
  const attrs = useLocatorAttrs()
  const a = withClass(
    attrs(testId, { className: `readout readout--${testId}` }),
    'mt-auto rounded-lg border border-ink-700 bg-ink-950/70 px-3 py-2 text-xs text-mist-300',
  )
  return (
    <p {...a}>
      <span className="font-semibold uppercase tracking-wide text-mist-500">{label}: </span>
      <span className="font-mono text-volt-300">{value}</span>
    </p>
  )
}
