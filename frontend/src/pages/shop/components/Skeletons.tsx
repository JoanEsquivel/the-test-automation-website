/** Loading placeholders for every server-backed store view.
 * Each block is a polite `role="status"` region marked `aria-busy` so screen
 * readers — and automation — can tell "still loading" from "empty". */

function Bar({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`block rounded bg-ink-700 ${className}`} />
}

export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      data-testid="catalog-skeletons"
      className="grid animate-pulse gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      <span className="sr-only">Loading products…</span>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="rounded-2xl border border-ink-700 bg-ink-900 p-5">
          <Bar className="mb-5 h-16 w-16" />
          <Bar className="mb-2 h-4 w-4/5" />
          <Bar className="mb-4 h-4 w-2/5" />
          <Bar className="h-9 w-full" />
        </div>
      ))}
    </div>
  )
}

export function DetailSkeleton({ testId = 'detail-skeleton' }: { testId?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      data-testid={testId}
      className="grid animate-pulse gap-8 rounded-2xl border border-ink-700 bg-ink-900 p-6 md:grid-cols-2"
    >
      <span className="sr-only">Loading…</span>
      <Bar className="h-56 w-full" />
      <div className="space-y-3">
        <Bar className="h-7 w-3/4" />
        <Bar className="h-5 w-1/3" />
        <Bar className="h-4 w-full" />
        <Bar className="h-4 w-5/6" />
        <Bar className="h-10 w-40" />
      </div>
    </div>
  )
}

export function ListSkeleton({ rows = 3, testId = 'list-skeleton' }: { rows?: number; testId?: string }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" data-testid={testId} className="animate-pulse space-y-3">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="rounded-2xl border border-ink-700 bg-ink-900 p-5">
          <Bar className="mb-2 h-4 w-1/3" />
          <Bar className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  )
}
