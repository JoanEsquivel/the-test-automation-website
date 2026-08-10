import { useState } from 'react'

import { PageIntro } from '@/components/ui/PageIntro'
import { DifficultySelector } from '@/playground/DifficultySelector'
import {
  DelayedAppearance,
  DelayedEnable,
  SpinnerThenContent,
  TextSwap,
} from '@/pages/playground/widgets/dynamic/DelayChallenges'
import {
  AutoDismissToasts,
  InfiniteScrollFeed,
  ProgressChallenge,
  StaleElementTrap,
} from '@/pages/playground/widgets/dynamic/AsyncFeedback'
import { WidgetSection } from '@/pages/playground/widgets/WidgetChrome'

const DELAY_MIN = 500
const DELAY_MAX = 10000
const DELAY_DEFAULT = 2000

/** Shared delay control. Keeps data-testid="delay-slider" at ALL difficulty
 * levels: it is the control panel of the page, not part of the challenge. */
function DelayControl({ delayMs, onChange }: { delayMs: number; onChange: (value: number) => void }) {
  return (
    <section
      aria-label="Shared delay control"
      className="mb-8 rounded-2xl border border-ink-700 bg-ink-900/70 p-4"
    >
      <div className="flex flex-wrap items-center gap-4">
        <label htmlFor="delay-slider" className="text-xs font-semibold uppercase tracking-widest text-mist-400">
          Shared delay
        </label>
        <input
          id="delay-slider"
          data-testid="delay-slider"
          type="range"
          min={DELAY_MIN}
          max={DELAY_MAX}
          step={100}
          value={delayMs}
          onChange={(event) => onChange(Number(event.target.value))}
          className="flex-1 accent-volt-400"
        />
        <output htmlFor="delay-slider" data-testid="delay-value" className="font-mono text-sm text-volt-300">
          {delayMs} ms
        </output>
      </div>
      <p className="mt-2 text-xs text-mist-500">
        Every challenge below uses this delay ({DELAY_MIN}–{DELAY_MAX} ms). Push it to the top and
        any hard-coded sleep in your suite will show itself.
      </p>
    </section>
  )
}

export default function DynamicPage() {
  const [delayMs, setDelayMs] = useState(DELAY_DEFAULT)

  return (
    <div>
      <PageIntro
        title="Dynamic & async challenges"
        what="Eight timing challenges: delayed appearance, delayed enabling, spinners, a stale-element trap, toasts that dismiss themselves, infinite scroll, a progress bar, and text that changes in place."
        how="Set the shared delay, trigger a challenge, and wait for the OBSERVABLE outcome rather than a duration. Every card keeps a readout with a stable data-testid at all difficulty levels, so there is always something real to wait for. If your test passes at 500 ms and fails at 8000 ms, it is not waiting. It is guessing."
      />
      <DifficultySelector />
      <DelayControl delayMs={delayMs} onChange={setDelayMs} />

      <WidgetSection
        title="Waiting for elements"
        description="The four things explicit waits were invented for: an element appearing, a button becoming enabled, a spinner being replaced, and text changing without the node moving."
        columns="md:grid-cols-2"
      >
        <DelayedAppearance delayMs={delayMs} />
        <DelayedEnable delayMs={delayMs} />
        <SpinnerThenContent delayMs={delayMs} />
        <TextSwap delayMs={delayMs} />
      </WidgetSection>

      <WidgetSection
        title="Re-renders & notifications"
        description="Nodes that get replaced while you hold a reference to them, and messages that vanish before your assertion arrives."
        columns="md:grid-cols-2"
      >
        <StaleElementTrap />
        <AutoDismissToasts delayMs={delayMs} />
      </WidgetSection>

      <WidgetSection
        title="Streams & progress"
        description="Content that keeps arriving as you scroll, and work that takes visible time to finish."
        columns="md:grid-cols-2"
      >
        <InfiniteScrollFeed />
        <ProgressChallenge delayMs={delayMs} />
      </WidgetSection>
    </div>
  )
}
