import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

import { AutomationNote, ChallengeReadout } from '@/pages/playground/widgets/ChallengeChrome'
import { VariantCard } from '@/pages/playground/widgets/WidgetChrome'

const OPTIONS = ['Alpha', 'Bravo', 'Charlie', 'Delta']

/** E.6 — listbox that IGNORES mouse clicks: keyboard navigation only. */
export function KeyboardOnlyListbox() {
  const [highlighted, setHighlighted] = useState(-1)
  const [selected, setSelected] = useState('none')

  function onKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlighted((index) => Math.min(OPTIONS.length - 1, index + 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlighted((index) => Math.max(0, index - 1))
    } else if (event.key === 'Enter' && highlighted >= 0) {
      event.preventDefault()
      setSelected(OPTIONS[highlighted])
    }
  }

  return (
    <VariantCard name="7a. Keyboard-only listbox" verdict="challenge">
      <p className="text-xs text-mist-400">
        This listbox swallows every mouse event on purpose: preventDefault, no click handlers.
        Plenty of real widgets behave this way, and driving by keyboard is how you check the
        accessible version works at all. Focus it, use ↑/↓, press Enter.
      </p>
      {/* oxlint-disable-next-line no-noninteractive-element-to-interactive-role -- canonical WAI-ARIA listbox markup: ul[role=listbox] with li[role=option] */}
      <ul role="listbox"
        tabIndex={0}
        aria-label="Keyboard-only listbox"
        aria-activedescendant={highlighted >= 0 ? `kbd-option-${OPTIONS[highlighted]}` : undefined}
        onKeyDown={onKeyDown}
        onMouseDown={(event) => event.preventDefault()}
        className="divide-y divide-ink-700 rounded-lg border border-ink-700"
      >
        {OPTIONS.map((option, index) => (
          // oxlint-disable-next-line no-noninteractive-element-to-interactive-role -- canonical ARIA option: keyboard is handled on the listbox via aria-activedescendant
          <li role="option"
            key={option}
            id={`kbd-option-${option}`}
            aria-selected={selected === option}
            className={`px-3 py-1.5 text-sm ${
              index === highlighted
                ? 'bg-volt-500/15 text-volt-300'
                : selected === option
                  ? 'text-emerald-300'
                  : 'text-mist-200'
            }`}
          >
            {option}
            {selected === option ? ' ✓' : ''}
          </li>
        ))}
      </ul>
      <ChallengeReadout testId="interactions-keyboard-readout" label="Selected" value={selected} />
      <AutomationNote>
        A click-based script gets NOTHING here. Focus the listbox with{' '}
        <code>locator.focus()</code>, then <code>keyboard.press(&apos;ArrowDown&apos;)</code> and{' '}
        <code>Enter</code>. In Selenium, <code>sendKeys(Keys.ARROW_DOWN, Keys.ENTER)</code> on the
        focused element.
      </AutomationNote>
    </VariantCard>
  )
}

const HOLD_MS = 800

/** E.7 — double-click cell and press-and-hold button (fires after 800 ms). */
export function ClickTimingChallenges() {
  const [doubleClicks, setDoubleClicks] = useState(0)
  const [holdState, setHoldState] = useState<'idle' | 'holding' | 'held' | 'early'>('idle')
  const holdTimer = useRef<number | null>(null)

  useEffect(() => () => window.clearTimeout(holdTimer.current ?? undefined), [])

  function startHold() {
    window.clearTimeout(holdTimer.current ?? undefined)
    setHoldState('holding')
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = null
      setHoldState('held')
    }, HOLD_MS)
  }

  function endHold() {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current)
      holdTimer.current = null
      setHoldState('early')
    }
  }

  return (
    <VariantCard name="7b. Double-click & press-and-hold" verdict="challenge">
      <p className="text-xs text-mist-400">
        The cell reacts ONLY to double-clicks; the button fires only after being held for{' '}
        {HOLD_MS} ms. Single clicks and quick taps do nothing.
      </p>
      <div
        data-testid="interactions-dblclick-cell"
        role="button"
        tabIndex={0}
        aria-label="Double-click cell"
        onDoubleClick={() => setDoubleClicks((count) => count + 1)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') setDoubleClicks((count) => count + 1)
        }}
        className="flex h-14 cursor-pointer items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-sm text-mist-200"
      >
        Double-click me (Enter works too)
      </div>
      <ChallengeReadout
        testId="interactions-dblclick-readout"
        label="Double-clicks"
        value={String(doubleClicks)}
      />
      <button
        type="button"
        onPointerDown={startHold}
        onPointerUp={endHold}
        onPointerLeave={endHold}
        className="rounded-lg border border-pulse-500/40 bg-pulse-500/10 px-4 py-2 text-sm font-semibold text-pulse-300 hover:bg-pulse-500/20"
      >
        Press and hold ({HOLD_MS} ms)
      </button>
      <ChallengeReadout
        testId="interactions-hold-readout"
        label="Hold status"
        value={
          holdState === 'idle'
            ? 'idle'
            : holdState === 'holding'
              ? 'holding…'
              : holdState === 'held'
                ? 'Long press registered!'
                : 'released too early'
        }
      />
      <AutomationNote>
        <code>locator.dblclick()</code> handles the cell. The hold needs three steps:{' '}
        <code>mouse.down()</code>, wait at least {HOLD_MS} ms, <code>mouse.up()</code>. Selenium
        spells it <code>Actions.clickAndHold().pause(Duration.ofMillis(900)).release()</code>.
      </AutomationNote>
    </VariantCard>
  )
}
