import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/Badge'
import { PageIntro } from '@/components/ui/PageIntro'
import { PLAYGROUND_CATEGORIES, type PlaygroundCategory } from '@/playground/registry'

function CardBody({ category }: { category: PlaygroundCategory }) {
  return (
    <>
      <div className="flex items-start justify-between">
        <span aria-hidden="true" className="text-3xl">
          {category.emoji}
        </span>
        {category.comingSoon ? (
          <Badge tone="pulse">Next phase</Badge>
        ) : (
          <span
            aria-hidden="true"
            className="font-display text-xl text-mist-500 transition-transform group-hover:translate-x-1 group-hover:text-volt-400"
          >
            →
          </span>
        )}
      </div>
      <h2 className="font-display mt-4 text-lg font-bold text-mist-50">{category.title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-mist-400">{category.description}</p>
    </>
  )
}

export default function PlaygroundHubPage() {
  return (
    <div>
      <PageIntro
        title="Components Playground"
        what="A catalog of UI elements in multiple implementation variants, plus deliberate automation challenges."
        how='Pick a category below. Each page includes a locator difficulty selector (easy / medium / evil) and marks the recommended modern implementation of every widget with a green "Recommended" badge.'
      />
      <section aria-label="Playground categories" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLAYGROUND_CATEGORIES.map((category) =>
          category.comingSoon ? (
            <div
              key={category.slug}
              data-testid={`category-${category.slug}`}
              aria-label={`${category.title} — coming in the next phase`}
              className="rounded-2xl border border-ink-800 bg-ink-900/40 p-6 opacity-75"
            >
              <CardBody category={category} />
            </div>
          ) : (
            <Link
              key={category.slug}
              to={category.path}
              data-testid={`category-${category.slug}`}
              className="group rounded-2xl border border-ink-700 bg-ink-900 p-6 transition-transform hover:-translate-y-1 hover:border-ink-600"
            >
              <CardBody category={category} />
            </Link>
          ),
        )}
      </section>
    </div>
  )
}
