import type { ReactNode } from 'react'

/**
 * Outcome readout for automation CHALLENGES. Unlike `Readout` (which honors
 * the locator difficulty), this keeps its data-testid at ALL levels: these
 * pages test waits/structure/gestures, not locator strategies.
 */
export function ChallengeReadout({
  testId,
  label,
  value,
}: {
  testId: string
  label: string
  value: string
}) {
  return (
    <p
      data-testid={testId}
      className="rounded-lg border border-ink-700 bg-ink-950/70 px-3 py-2 text-xs text-mist-300"
    >
      <span className="font-semibold uppercase tracking-wide text-mist-500">{label}: </span>
      <span className="font-mono text-volt-300">{value}</span>
    </p>
  )
}

/** Expandable per-challenge note: how a serious test suite would handle this. */
export function AutomationNote({ children }: { children: ReactNode }) {
  return (
    <details className="rounded-lg border border-ink-700 bg-ink-950/50 px-3 py-2 text-xs text-mist-400">
      <summary className="cursor-pointer font-semibold text-mist-300">
        What good automation looks like
      </summary>
      <div className="mt-2 leading-relaxed">{children}</div>
    </details>
  )
}
