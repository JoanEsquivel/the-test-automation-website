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
        Every challenge below uses this delay ({DELAY_MIN}–{DELAY_MAX} ms). Crank it up to expose
        scripts that rely on hard-coded sleeps.
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
        what="Eight timing challenges: delayed appearance and enabling, spinners, a stale-element trap, auto-dismissing toasts, infinite scroll, a progress bar and an in-place text swap."
        how="Set the shared delay slider, then trigger each challenge and make your script wait for the OBSERVABLE outcome (each card has a readout with a stable data-testid at every difficulty level). If your test only passes at 500 ms, it is not waiting — it is gambling."
      />
      <DifficultySelector />
      <DelayControl delayMs={delayMs} onChange={setDelayMs} />

      <WidgetSection
        title="Waiting for elements"
        description="Appearance, enablement, spinner replacement and in-place text changes — the four canonical explicit-wait targets."
        columns="md:grid-cols-2"
      >
        <DelayedAppearance delayMs={delayMs} />
        <DelayedEnable delayMs={delayMs} />
        <SpinnerThenContent delayMs={delayMs} />
        <TextSwap delayMs={delayMs} />
      </WidgetSection>

      <WidgetSection
        title="Re-renders & notifications"
        description="DOM nodes that are replaced under your feet, and messages that will not wait for you."
        columns="md:grid-cols-2"
      >
        <StaleElementTrap />
        <AutoDismissToasts delayMs={delayMs} />
      </WidgetSection>

      <WidgetSection
        title="Streams & progress"
        description="Content that keeps arriving, and work that takes visible time."
        columns="md:grid-cols-2"
      >
        <InfiniteScrollFeed />
        <ProgressChallenge delayMs={delayMs} />
      </WidgetSection>
    </div>
  )
}
