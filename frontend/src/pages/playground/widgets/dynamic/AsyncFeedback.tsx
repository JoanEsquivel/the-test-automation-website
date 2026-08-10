import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { AutomationNote, ChallengeReadout } from '@/pages/playground/widgets/ChallengeChrome'
import { VariantCard } from '@/pages/playground/widgets/WidgetChrome'

interface DelayProps {
  delayMs: number
}

const STALE_ROWS = ['Alpha row', 'Bravo row', 'Charlie row', 'Delta row']

/** C.4 — list fully re-renders with NEW DOM nodes every 3 s (stale trap). */
export function StaleElementTrap() {
  const [generation, setGeneration] = useState(1)

  useEffect(() => {
    const interval = window.setInterval(() => setGeneration((value) => value + 1), 3000)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <VariantCard name="4. Stale element trap" verdict="challenge">
      <p className="text-xs text-mist-400">
        Every 3 seconds the React keys change and this list is rebuilt from brand-new DOM nodes.
        Hold a WebElement across that and Selenium throws StaleElementReferenceException.
      </p>
      <ul className="divide-y divide-ink-700 rounded-lg border border-ink-700">
        {STALE_ROWS.map((label, index) => (
          <li
            key={`${generation}-${label}`}
            className="flex items-center justify-between px-3 py-1.5 text-sm text-mist-200"
          >
            {label}
            <span className="font-mono text-xs text-mist-500">
              node #{generation}.{index + 1}
            </span>
          </li>
        ))}
      </ul>
      <ChallengeReadout testId="dynamic-stale-generation" label="Generation" value={String(generation)} />
      <AutomationNote>
        Find elements at the moment you use them. Playwright locators re-resolve on every action,
        so this trap cannot touch them. In Selenium, re-locate inside a retry loop instead of
        caching WebElements in a page object.
      </AutomationNote>
    </VariantCard>
  )
}

interface Toast {
  id: number
  kind: 'success' | 'error'
  delay: number
}

/** C.5 — auto-dismissing toasts with a draining progress bar. */
export function AutoDismissToasts({ delayMs }: DelayProps) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  function fire(kind: Toast['kind']) {
    const id = nextId.current
    nextId.current += 1
    setToasts((current) => [...current, { id, kind, delay: delayMs }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, delayMs)
  }

  return (
    <VariantCard name="5. Auto-dismiss toasts" verdict="challenge">
      <p className="text-xs text-mist-400">
        Toasts remove themselves after the delay. Catch one BEFORE it goes, or assert that it
        eventually goes. Both are legitimate tests.
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => fire('success')}>
          Show success toast
        </Button>
        <Button size="sm" variant="danger" onClick={() => fire('error')}>
          Show error toast
        </Button>
      </div>
      <div aria-live="polite" className="flex min-h-16 flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            data-testid={`toast-${toast.kind}`}
            role={toast.kind === 'error' ? 'alert' : 'status'}
            className={`overflow-hidden rounded-lg border px-3 pb-0 pt-2 text-sm ${
              toast.kind === 'success'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-red-500/40 bg-red-500/10 text-red-300'
            }`}
          >
            {toast.kind === 'success' ? 'Saved successfully.' : 'Something went wrong.'}
            <div
              aria-hidden="true"
              className={`mt-2 -mx-3 h-1 ${toast.kind === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`}
              style={{ animation: `toast-progress ${toast.delay}ms linear forwards` }}
            />
          </div>
        ))}
      </div>
      <AutomationNote>
        Auto-waiting assertions catch toasts reliably, so read the text the moment the locator
        resolves. To verify dismissal, assert the locator is hidden with a timeout larger than the
        configured delay.
      </AutomationNote>
    </VariantCard>
  )
}

/** C.7 — progress bar fills over the delay, then a completion banner fires. */
export function ProgressChallenge({ delayMs }: DelayProps) {
  const [status, setStatus] = useState<'idle' | 'running' | 'complete'>('idle')
  const [percent, setPercent] = useState(0)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => () => window.clearInterval(intervalRef.current ?? undefined), [])

  function start() {
    window.clearInterval(intervalRef.current ?? undefined)
    setStatus('running')
    setPercent(0)
    const startedAt = Date.now()
    const total = delayMs
    intervalRef.current = window.setInterval(() => {
      const value = Math.min(100, Math.round(((Date.now() - startedAt) / total) * 100))
      setPercent(value)
      if (value >= 100) {
        window.clearInterval(intervalRef.current ?? undefined)
        setStatus('complete')
      }
    }, 100)
  }

  return (
    <VariantCard name="7. Progress bar" verdict="challenge">
      <p className="text-xs text-mist-400">
        Fills over the configured delay. Wait for the completion banner, not for whatever
        percentage you happened to sample.
      </p>
      <Button size="sm" onClick={start}>
        Start progress
      </Button>
      <div
        role="progressbar"
        aria-label="Task progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-3 overflow-hidden rounded-full border border-ink-600 bg-ink-800"
      >
        <div className="h-full bg-volt-500" style={{ width: `${percent}%` }} />
      </div>
      <ChallengeReadout testId="dynamic-progress-status" label="Status" value={status} />
      {status === 'complete' ? (
        <div
          data-testid="dynamic-progress-banner"
          className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
        >
          Task complete, 100%.
        </div>
      ) : null}
      <AutomationNote>
        Wait for the terminal state, meaning the banner or the status text, with a timeout
        comfortably above the slider value. Polling <code>aria-valuenow</code> is only worth doing
        if you want to prove progress never goes backwards.
      </AutomationNote>
    </VariantCard>
  )
}

const FEED_MAX = 100
const FEED_PAGE = 10

/** C.6 — infinite scroll: +10 items whenever the sentinel enters the viewport. */
export function InfiniteScrollFeed() {
  const [count, setCount] = useState(FEED_PAGE)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const observerSupported = typeof IntersectionObserver !== 'undefined'

  useEffect(() => {
    // jsdom has no IntersectionObserver — the guard keeps unit tests rendering.
    if (typeof IntersectionObserver === 'undefined') return undefined
    const sentinel = sentinelRef.current
    if (!sentinel) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setCount((current) => Math.min(FEED_MAX, current + FEED_PAGE))
        }
      },
      { root: containerRef.current, rootMargin: '80px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return (
    <VariantCard name="6. Infinite scroll" verdict="challenge">
      <p className="text-xs text-mist-400">
        Ten more items load each time the sentinel at the bottom scrolls into view, up to{' '}
        {FEED_MAX}. Scroll INSIDE the container: the window scrollbar does nothing here.
      </p>
      <div
        ref={containerRef}
        data-testid="dynamic-feed"
        className="h-56 overflow-y-auto rounded-lg border border-ink-700"
      >
        <ul className="divide-y divide-ink-800">
          {Array.from({ length: count }, (_, index) => (
            <li key={index} className="px-3 py-2 text-sm text-mist-200">
              Feed item #{index + 1}
            </li>
          ))}
        </ul>
        <div ref={sentinelRef} className="px-3 py-2 text-center text-xs text-mist-500">
          {count >= FEED_MAX ? 'End of feed.' : observerSupported ? 'Loading more…' : 'IntersectionObserver unavailable in this environment.'}
        </div>
      </div>
      <ChallengeReadout testId="dynamic-feed-count" label="Items" value={`${count} / ${FEED_MAX}`} />
      <AutomationNote>
        Loop it: scroll the sentinel into view, wait for the item count to increase, repeat.{' '}
        <code>locator.scrollIntoViewIfNeeded()</code> plus a count assertion. The feed has its own
        scrollbar, so scrolling the window gets you nowhere.
      </AutomationNote>
    </VariantCard>
  )
}
