import type { ReactNode } from 'react'

interface PageIntroProps {
  title: string
  /** What this page does — one or two sentences. */
  what: ReactNode
  /** How to use it — concrete instructions for the visitor. */
  how: ReactNode
  /** Optional extra content (e.g. tips, credentials) rendered below the columns. */
  children?: ReactNode
}

/**
 * Every page on the site opens with a PageIntro: the self-describing rule.
 * Visitors should never have to guess what a page is for or how to exercise it.
 */
export function PageIntro({ title, what, how, children }: PageIntroProps) {
  return (
    <header data-testid="page-intro" className="mb-8">
      <h1 className="font-display text-3xl font-bold tracking-tight text-mist-50 sm:text-4xl">{title}</h1>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-ink-700 bg-ink-900/70 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-volt-400">What this page does</h2>
          <p className="mt-2 text-sm leading-relaxed text-mist-300">{what}</p>
        </div>
        <div className="rounded-xl border border-ink-700 bg-ink-900/70 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-pulse-400">How to use it</h2>
          <p className="mt-2 text-sm leading-relaxed text-mist-300">{how}</p>
        </div>
      </div>
      {children}
    </header>
  )
}
