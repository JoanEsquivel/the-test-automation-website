import { useId, useRef, useState } from 'react'

const TABS = [
  {
    id: 'playwright',
    label: 'Playwright',
    content:
      'Playwright handles this with getByRole("tab") and toHaveAttribute("aria-selected"). Nothing custom required.',
  },
  {
    id: 'selenium',
    label: 'Selenium',
    content:
      'Selenium reaches these tabs with By.cssSelector("[role=tab]") plus keyboard actions. Arrow keys move the selection because the tabs implement roving tabindex.',
  },
  {
    id: 'cypress',
    label: 'Cypress',
    content:
      'Cypress does it with cy.get("[role=tab]").type("{rightarrow}"). Selection follows focus in this pattern, so no extra clicks.',
  },
]

/** WAI-ARIA tabs pattern: roving tabindex, arrow-key activation, aria-selected. */
export function AriaTabs() {
  const idBase = useId()
  const [active, setActive] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const activate = (index: number) => {
    const next = (index + TABS.length) % TABS.length
    setActive(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <div>
      <div role="tablist" aria-label="Automation tools" className="flex gap-1 rounded-lg border border-ink-700 bg-ink-800 p-1">
        {TABS.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`${idBase}-tab-${tab.id}`}
            aria-selected={active === index}
            aria-controls={`${idBase}-panel-${tab.id}`}
            tabIndex={active === index ? 0 : -1}
            ref={(el) => {
              tabRefs.current[index] = el
            }}
            onClick={() => setActive(index)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') {
                event.preventDefault()
                activate(index + 1)
              } else if (event.key === 'ArrowLeft') {
                event.preventDefault()
                activate(index - 1)
              } else if (event.key === 'Home') {
                event.preventDefault()
                activate(0)
              } else if (event.key === 'End') {
                event.preventDefault()
                activate(TABS.length - 1)
              }
            }}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
              active === index ? 'bg-volt-500 text-ink-950' : 'text-mist-400 hover:text-mist-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${idBase}-panel-${TABS[active].id}`}
        aria-labelledby={`${idBase}-tab-${TABS[active].id}`}
        tabIndex={0}
        className="mt-3 rounded-lg border border-ink-700 bg-ink-950/60 p-4 text-sm leading-relaxed text-mist-300"
      >
        {TABS[active].content}
      </div>
    </div>
  )
}
