import { Link } from 'react-router-dom'

import { PageIntro } from '@/components/ui/PageIntro'
import { PLAYGROUND_CATEGORIES, type PlaygroundCategory } from '@/playground/registry'

function CategoryCard({ category }: { category: PlaygroundCategory }) {
  return (
    <div
      data-testid={`category-${category.slug}`}
      className="flex flex-col rounded-2xl border border-ink-700 bg-ink-900 transition-colors hover:border-ink-600"
    >
      <Link to={category.path} className="group block p-6">
        <div className="flex items-start justify-between">
          <span aria-hidden="true" className="text-3xl">
            {category.emoji}
          </span>
          <span
            aria-hidden="true"
            className="font-display text-xl text-mist-500 transition-transform group-hover:translate-x-1 group-hover:text-volt-400"
          >
            →
          </span>
        </div>
        <h2 className="font-display mt-4 text-lg font-bold text-mist-50">{category.title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-mist-400">{category.description}</p>
      </Link>
      {category.cheatSheet ? (
        <details className="mx-6 mb-4 mt-auto rounded-lg border border-ink-700 bg-ink-950/50 px-3 py-2 text-xs">
          <summary className="cursor-pointer font-semibold text-mist-300">
            Automation cheat-sheet
          </summary>
          <ul className="mt-2 space-y-1 text-mist-400">
            {category.cheatSheet.map((entry) => (
              <li key={entry.tool}>
                <strong className="text-mist-300">{entry.tool}</strong>:{' '}
                <code className="font-mono text-volt-300">{entry.api}</code>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  )
}

export default function PlaygroundHubPage() {
  return (
    <div>
      <PageIntro
        title="Components Playground"
        what="A catalog of UI elements in multiple implementation variants, plus deliberate automation challenges: waits, iframes, shadow DOM, windows, files and tricky interactions."
        how='Pick a category below. Each page includes a locator difficulty selector (easy / medium / evil) and marks the recommended modern implementation of every widget with a green "Recommended" badge. Challenge categories carry an expandable automation cheat-sheet mapping tool APIs to the challenge.'
      />
      <section aria-label="Playground categories" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLAYGROUND_CATEGORIES.map((category) => (
          <CategoryCard key={category.slug} category={category} />
        ))}
      </section>
    </div>
  )
}
