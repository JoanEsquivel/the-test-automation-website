import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { PageIntro } from '@/components/ui/PageIntro'
import { DifficultySelector } from '@/playground/DifficultySelector'
import { useLocatorAttrs, withClass } from '@/playground/locators'
import { NativeDialogCard } from '@/pages/playground/widgets/modals/NativeDialogCard'
import { PortalModalCard } from '@/pages/playground/widgets/modals/PortalModalCard'
import { Readout, VariantCard, WidgetSection } from '@/pages/playground/widgets/WidgetChrome'

/** Anti-pattern: display:none toggle. Content always in the DOM, focus goes nowhere. */
function LegacyInlineModal() {
  const attrs = useLocatorAttrs()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open legacy modal
      </Button>
      <div
        style={{ display: open ? 'block' : 'none' }}
        {...withClass(
          attrs('modals-legacy-box', { className: 'legacy-modal' }),
          'mt-3 rounded-xl border border-amber-500/40 bg-ink-800 p-4',
        )}
      >
        <h3 className="font-display text-sm font-bold">Legacy inline "modal"</h3>
        <p className="mt-1 text-xs text-mist-400">
          I was always in the DOM — your visibility assertions better check computed styles. Focus
          stayed on the trigger, Escape does nothing, and the page behind me still scrolls.
        </p>
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => setOpen(false)}>
          Close
        </Button>
      </div>
      <Readout testId="modals-legacy-readout" label="State" value={open ? 'open' : 'closed'} />
    </>
  )
}

function TooltipCards() {
  const attrs = useLocatorAttrs()
  return (
    <>
      <VariantCard name="popover attribute API" verdict="recommended">
        <button
          type="button"
          popoverTarget="modals-tips-popover"
          {...withClass(
            attrs('modals-popover-trigger', { className: 'popover-trigger' }),
            'inline-flex items-center justify-center rounded-lg border border-ink-600 bg-ink-700 px-4 py-2 text-sm font-medium text-mist-100 transition-colors hover:bg-ink-600',
          )}
        >
          Toggle popover
        </button>
        <div
          popover="auto"
          id="modals-tips-popover"
          className="rounded-xl border border-ink-600 bg-ink-800 p-4 text-sm text-mist-200"
        >
          Declarative top-layer popover: light dismiss and Escape handling come from the browser,
          no JavaScript required.
        </div>
        <p className="text-xs text-mist-500">
          Native top layer + light dismiss. (Not implemented by jsdom — exercise this one in a real
          browser.)
        </p>
      </VariantCard>

      <VariantCard name="title attribute" verdict="legacy">
        <button
          type="button"
          title="I only appear after a long hover, unstyled, and never on touch screens"
          {...withClass(
            attrs('modals-title-tooltip', { className: 'title-tooltip-trigger' }),
            'inline-flex items-center justify-center rounded-lg border border-ink-600 bg-ink-700 px-4 py-2 text-sm font-medium text-mist-100',
          )}
        >
          Hover me (title attribute)
        </button>
        <p className="text-xs text-mist-500">
          Browser-native but invisible to automation screenshots and unreachable on touch. Assert
          the attribute, not the bubble.
        </p>
      </VariantCard>

      <VariantCard name="Hover <div> tooltip" verdict="antiPattern">
        <span className="group relative inline-block">
          <span
            {...withClass(
              attrs('modals-hover-tooltip-trigger', { className: 'hover-tooltip-trigger' }),
              'inline-flex cursor-help items-center justify-center rounded-lg border border-dashed border-ink-600 bg-ink-800 px-4 py-2 text-sm text-mist-300',
            )}
          >
            Hover me (CSS div)
          </span>
          <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-48 -translate-x-1/2 rounded-lg border border-ink-600 bg-ink-800 p-2 text-xs text-mist-200 group-hover:block">
            Pure CSS :hover tooltip — you need a real pointer hover action to ever see me.
          </span>
        </span>
        <p className="text-xs text-mist-500">No role, no aria-describedby, gone on touch. </p>
      </VariantCard>
    </>
  )
}

export default function ModalsPage() {
  return (
    <div>
      <PageIntro
        title="Modals & popovers"
        what="Three modal implementations — native dialog, portal overlay with focus trap, and a display:none relic — plus three flavors of tooltip."
        how="Open each modal, complete or dismiss it, and assert the Result readout. Try Escape and Tab in the portal modal to feel the focus trap. The native dialog uses showModal() in real browsers and a graceful fallback where it is missing."
      />
      <DifficultySelector />

      <WidgetSection
        title="Modal"
        description="A real modal owns focus and the top layer. Only one of these three does it natively."
      >
        <VariantCard name="<dialog showModal>" verdict="recommended">
          <NativeDialogCard />
        </VariantCard>
        <VariantCard name="React portal + focus trap" verdict="advanced">
          <PortalModalCard />
        </VariantCard>
        <VariantCard name="display:none toggle" verdict="antiPattern">
          <LegacyInlineModal />
        </VariantCard>
      </WidgetSection>

      <WidgetSection
        title="Tooltip / popover"
        description="From the brand-new popover attribute to the title attribute your grandparents used."
      >
        <TooltipCards />
      </WidgetSection>
    </div>
  )
}
