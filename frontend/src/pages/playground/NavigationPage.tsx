import { useState } from 'react'

import { PageIntro } from '@/components/ui/PageIntro'
import { DifficultySelector } from '@/playground/DifficultySelector'
import { useLocatorAttrs, withClass } from '@/playground/locators'
import { AriaTabs } from '@/pages/playground/widgets/navigation/AriaTabs'
import {
  DetailsAccordion,
  DisclosureAccordion,
  LegacySlideAccordion,
} from '@/pages/playground/widgets/navigation/Accordions'
import { Readout, VariantCard, WidgetSection } from '@/pages/playground/widgets/WidgetChrome'

const TARGET_PANELS = [
  { id: 'nav-target-basics', label: 'Basics', text: 'Panels toggle purely via the URL hash and the CSS :target selector.' },
  { id: 'nav-target-caveats', label: 'Caveats', text: 'No aria-selected, no keyboard support, and every click adds an entry to the history stack.' },
]

function TargetTabsCard() {
  return (
    <VariantCard name="Anchor links + :target CSS" verdict="legacy">
      <nav aria-label="Hash tabs" className="flex gap-2">
        {TARGET_PANELS.map((panel) => (
          <a
            key={panel.id}
            href={`#${panel.id}`}
            className="rounded-lg border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm text-mist-300 hover:text-mist-100"
          >
            {panel.label}
          </a>
        ))}
      </nav>
      {TARGET_PANELS.map((panel) => (
        <div
          key={panel.id}
          id={panel.id}
          className="hidden rounded-lg border border-ink-700 bg-ink-950/60 p-3 text-sm text-mist-300 [&:target]:block"
        >
          {panel.text}
        </div>
      ))}
      <p className="text-xs text-mist-500">
        The panel appears through CSS :target, so the state is in the URL and nowhere in the
        accessibility tree. Role-based queries cannot see it.
      </p>
    </VariantCard>
  )
}

function WayfindingCard() {
  const attrs = useLocatorAttrs()
  const [page, setPage] = useState(1)
  const pages = [1, 2, 3, 4, 5]

  return (
    <VariantCard name="Semantic <nav>: breadcrumb + pagination" verdict="recommended">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-sm">
          <li>
            <a href="/" className="text-volt-400 hover:underline">
              Home
            </a>
          </li>
          <li aria-hidden="true" className="text-mist-500">
            /
          </li>
          <li>
            <a href="/playground" className="text-volt-400 hover:underline">
              Playground
            </a>
          </li>
          <li aria-hidden="true" className="text-mist-500">
            /
          </li>
          <li aria-current="page" className="text-mist-300">
            Navigation
          </li>
        </ol>
      </nav>
      <nav aria-label="Pagination" className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous results page"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="rounded-lg border border-ink-600 bg-ink-800 px-2.5 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          ‹
        </button>
        {pages.map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`Page ${n}`}
            aria-current={page === n ? 'page' : undefined}
            onClick={() => setPage(n)}
            className={`rounded-lg border px-2.5 py-1 text-sm ${
              page === n
                ? 'border-volt-500/60 bg-volt-500/20 font-bold text-volt-300'
                : 'border-ink-600 bg-ink-800 text-mist-300 hover:text-mist-100'
            }`}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          aria-label="Next results page"
          disabled={page === pages.length}
          onClick={() => setPage((p) => Math.min(pages.length, p + 1))}
          className="rounded-lg border border-ink-600 bg-ink-800 px-2.5 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          ›
        </button>
      </nav>
      <Readout testId="navigation-pagination-readout" label="Current page" value={String(page)} />
      <div {...withClass(attrs('navigation-wayfinding-note', { className: 'wayfinding-note' }), 'text-xs text-mist-500')}>
        Both widgets mark the current spot with aria-current="page". Assert that, not the class.
      </div>
    </VariantCard>
  )
}

export default function NavigationPage() {
  return (
    <div>
      <PageIntro
        title="Navigation"
        what="Tabs, accordions, breadcrumbs and pagination: the widgets that move people around a page, built properly and built badly."
        how="Drive the ARIA tabs with clicks and then with arrow keys, open both accordions, and page through the pagination. On the recommended variants the state is in the ARIA attributes: assert aria-selected, aria-expanded and aria-current instead of CSS classes."
      />
      <DifficultySelector />

      <WidgetSection
        title="Tabs"
        description="The ARIA pattern gives you role=tab, aria-selected and arrow-key support. The :target hack gives you a URL fragment and nothing else."
        columns="md:grid-cols-2"
      >
        <VariantCard name="ARIA tabs pattern" verdict="recommended">
          <AriaTabs />
        </VariantCard>
        <TargetTabsCard />
      </WidgetSection>

      <WidgetSection
        title="Accordion"
        description="Native details, an ARIA disclosure, and a jQuery-era slide. Same feature, three completely different DOMs to locate against."
      >
        <DetailsAccordion />
        <DisclosureAccordion />
        <LegacySlideAccordion />
      </WidgetSection>

      <WidgetSection
        title="Wayfinding"
        description="Breadcrumb and pagination in semantic nav landmarks."
        columns="md:grid-cols-2"
      >
        <WayfindingCard />
      </WidgetSection>
    </div>
  )
}
