import { useState } from 'react'

import { useLocatorAttrs, withClass } from '@/playground/locators'
import { Readout, VariantCard } from '@/pages/playground/widgets/WidgetChrome'

export function DetailsAccordion() {
  const attrs = useLocatorAttrs()
  const [openCount, setOpenCount] = useState(0)

  return (
    <VariantCard name="<details> / <summary>" verdict="recommended">
      <details
        onToggle={(event) => setOpenCount((c) => c + (event.currentTarget.open ? 1 : 0))}
        {...withClass(
          attrs('navigation-details-1', { className: 'details-accordion' }),
          'rounded-lg border border-ink-700 bg-ink-800/60 px-3 py-2',
        )}
      >
        <summary className="cursor-pointer text-sm font-semibold text-mist-100">
          Why native details wins
        </summary>
        <p className="mt-2 text-sm leading-relaxed text-mist-300">
          Keyboard support and semantics for free, state readable from the open attribute, and
          not one line of JavaScript shipped.
        </p>
      </details>
      <details
        {...withClass(
          attrs('navigation-details-2', { className: 'details-accordion' }),
          'rounded-lg border border-ink-700 bg-ink-800/60 px-3 py-2',
        )}
      >
        <summary className="cursor-pointer text-sm font-semibold text-mist-100">
          How to assert it
        </summary>
        <p className="mt-2 text-sm leading-relaxed text-mist-300">
          Assert the open attribute on the details element, or just assert the revealed text is
          visible. Either holds up.
        </p>
      </details>
      <Readout testId="navigation-details-readout" label="Times opened" value={String(openCount)} />
    </VariantCard>
  )
}

export function DisclosureAccordion() {
  const attrs = useLocatorAttrs()
  const [open, setOpen] = useState(false)

  return (
    <VariantCard name="ARIA disclosure buttons" verdict="ariaCustom">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        {...withClass(
          attrs('navigation-disclosure-trigger', { className: 'disclosure-trigger' }),
          'flex items-center justify-between gap-2 rounded-lg border border-ink-700 bg-ink-800/60 px-3 py-2 text-left text-sm font-semibold',
        )}
      >
        How disclosures work
        <span aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      {open && (
        <p className="rounded-lg border border-ink-700 bg-ink-950/60 p-3 text-sm leading-relaxed text-mist-300">
          The trigger's aria-expanded flips between true and false. Assert that attribute rather
          than guessing which CSS class means open this week.
        </p>
      )}
    </VariantCard>
  )
}

export function LegacySlideAccordion() {
  const attrs = useLocatorAttrs()
  const [open, setOpen] = useState(false)

  return (
    <VariantCard name="jQuery-style slide <div>" verdict="antiPattern">
      {/* oxlint-disable-next-line click-events-have-key-events, no-static-element-interactions -- deliberate anti-pattern exhibit: clickable div header with no button semantics */}
      <div
        onClick={() => setOpen((v) => !v)}
        {...withClass(
          attrs('navigation-slide-trigger', { className: 'slide-trigger' }),
          'cursor-pointer rounded-lg border border-ink-700 bg-ink-800/60 px-3 py-2 text-sm font-semibold select-none',
        )}
      >
        Click to slideToggle()
      </div>
      <div
        style={{ maxHeight: open ? '8rem' : '0' }}
        className="overflow-hidden transition-all duration-300"
      >
        <p className="p-3 text-sm leading-relaxed text-mist-300">
          This div is "closed" by animating its height to zero. The text is still in the DOM and
          still matches text queries, so a presence check passes on a panel nobody can read. Assert
          the collapsed height.
        </p>
      </div>
      <Readout testId="navigation-slide-readout" label="State" value={open ? 'open' : 'closed'} />
    </VariantCard>
  )
}
