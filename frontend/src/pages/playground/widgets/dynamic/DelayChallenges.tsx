import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { AutomationNote, ChallengeReadout } from '@/pages/playground/widgets/ChallengeChrome'
import { VariantCard } from '@/pages/playground/widgets/WidgetChrome'

interface DelayProps {
  delayMs: number
}

/** C.1 — button spawns an element after the configured delay. */
export function DelayedAppearance({ delayMs }: DelayProps) {
  const [state, setState] = useState<'idle' | 'waiting' | 'shown'>('idle')
  const timerRef = useRef<number | null>(null)

  useEffect(() => () => window.clearTimeout(timerRef.current ?? undefined), [])

  function spawn() {
    window.clearTimeout(timerRef.current ?? undefined)
    setState('waiting')
    timerRef.current = window.setTimeout(() => setState('shown'), delayMs)
  }

  return (
    <VariantCard name="1. Delayed appearance" verdict="challenge">
      <p className="text-xs text-mist-400">
        Click the button — the target element joins the DOM only after the delay. Your script
        must explicitly wait for it; it does not exist before that.
      </p>
      <Button size="sm" onClick={spawn}>
        Spawn element
      </Button>
      {state === 'shown' ? (
        <div
          data-testid="dynamic-appear-target"
          className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
        >
          I appeared after the delay — assert me!
        </div>
      ) : null}
      <ChallengeReadout
        testId="dynamic-appear-status"
        label="Status"
        value={state === 'idle' ? 'idle' : state === 'waiting' ? 'waiting…' : 'element present'}
      />
      <AutomationNote>
        Wait for the element itself, not for time: Playwright&apos;s{' '}
        <code>expect(locator).toBeVisible()</code> or Selenium&apos;s{' '}
        <code>ExpectedConditions.visibilityOfElementLocated</code>. Hard sleeps break as soon as
        someone moves the slider.
      </AutomationNote>
    </VariantCard>
  )
}

/** C.2 — button + input start disabled and enable after the delay. */
export function DelayedEnable({ delayMs }: DelayProps) {
  const [enabled, setEnabled] = useState(false)
  const [clicked, setClicked] = useState(false)
  const [generation, setGeneration] = useState(0)
  const delayRef = useRef(delayMs)
  delayRef.current = delayMs

  useEffect(() => {
    const timer = window.setTimeout(() => setEnabled(true), delayRef.current)
    return () => window.clearTimeout(timer)
  }, [generation])

  function rearm() {
    setEnabled(false)
    setClicked(false)
    setGeneration((value) => value + 1)
  }

  return (
    <VariantCard name="2. Delayed enable" verdict="challenge">
      <p className="text-xs text-mist-400">
        The input and button below start disabled and enable after the delay. Re-arm to replay.
      </p>
      <input
        type="text"
        disabled={!enabled}
        aria-label="Delayed-enable input"
        placeholder={enabled ? 'Now you can type' : 'Disabled until the delay elapses'}
        className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm text-mist-100 disabled:opacity-50"
      />
      <div className="flex gap-2">
        <Button size="sm" disabled={!enabled} onClick={() => setClicked(true)}>
          Click me when enabled
        </Button>
        <Button size="sm" variant="ghost" onClick={rearm}>
          Re-arm timer
        </Button>
      </div>
      <ChallengeReadout
        testId="dynamic-enable-status"
        label="Status"
        value={clicked ? 'clicked while enabled!' : enabled ? 'enabled' : 'disabled — waiting'}
      />
      <AutomationNote>
        Wait for enabled state, not presence: <code>expect(locator).toBeEnabled()</code> in
        Playwright, <code>elementToBeClickable</code> in Selenium. Clicking a disabled control
        silently does nothing.
      </AutomationNote>
    </VariantCard>
  )
}

/** C.3 — spinner/skeleton replaced by the loaded card. */
export function SpinnerThenContent({ delayMs }: DelayProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'loaded'>('idle')
  const timerRef = useRef<number | null>(null)

  useEffect(() => () => window.clearTimeout(timerRef.current ?? undefined), [])

  function load() {
    window.clearTimeout(timerRef.current ?? undefined)
    setState('loading')
    timerRef.current = window.setTimeout(() => setState('loaded'), delayMs)
  }

  return (
    <VariantCard name="3. Spinner then content" verdict="challenge">
      <p className="text-xs text-mist-400">
        A spinner holds the space while the &quot;request&quot; runs, then the real card replaces
        it. Wait for the spinner to disappear AND the content to appear.
      </p>
      <Button size="sm" onClick={load}>
        Load content
      </Button>
      {state === 'loading' ? (
        <div role="status" aria-label="Loading content" className="flex items-center gap-3 py-2">
          <span
            aria-hidden="true"
            className="inline-block size-5 animate-spin rounded-full border-2 border-ink-600 border-t-volt-400 motion-reduce:animate-none"
          />
          <span className="text-sm text-mist-400">Fetching…</span>
        </div>
      ) : null}
      {state === 'loaded' ? (
        <div
          data-testid="dynamic-loaded-card"
          className="rounded-lg border border-volt-500/40 bg-volt-500/10 px-3 py-2 text-sm text-volt-300"
        >
          Content loaded — the spinner is gone and this card is here to stay.
        </div>
      ) : null}
      <ChallengeReadout testId="dynamic-spinner-status" label="Status" value={state} />
      <AutomationNote>
        Assert the OUTCOME (the loaded card), not the spinner. Waiting for spinners to vanish is
        flaky when they are too fast to ever be observed.
      </AutomationNote>
    </VariantCard>
  )
}

/** C.8 — same node's text swaps "Loading…" → "Ready!" (no node replacement). */
export function TextSwap({ delayMs }: DelayProps) {
  const [phase, setPhase] = useState<'idle' | 'loading' | 'ready'>('idle')
  const timerRef = useRef<number | null>(null)

  useEffect(() => () => window.clearTimeout(timerRef.current ?? undefined), [])

  function start() {
    window.clearTimeout(timerRef.current ?? undefined)
    setPhase('loading')
    timerRef.current = window.setTimeout(() => setPhase('ready'), delayMs)
  }

  return (
    <VariantCard name="8. Text swap (same node)" verdict="challenge">
      <p className="text-xs text-mist-400">
        The paragraph below never leaves the DOM — only its TEXT changes. A held element
        reference stays valid; you wait for the text, not for a new element.
      </p>
      <p
        data-testid="dynamic-text-swap"
        className="rounded-lg border border-ink-700 bg-ink-950/70 px-3 py-2 font-mono text-sm text-mist-100"
      >
        {phase === 'idle' ? 'Press start to begin.' : phase === 'loading' ? 'Loading…' : 'Ready!'}
      </p>
      <Button size="sm" onClick={start}>
        Start text swap
      </Button>
      <AutomationNote>
        Use text-based waits on the SAME locator: <code>expect(locator).toHaveText(&apos;Ready!&apos;)</code>{' '}
        (Playwright) or <code>textToBePresentInElement</code> (Selenium). Contrast with the stale
        element trap, where the node itself is replaced.
      </AutomationNote>
    </VariantCard>
  )
}
