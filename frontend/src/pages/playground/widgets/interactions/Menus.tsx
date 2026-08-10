import { useRef, useState, type MouseEvent } from 'react'

import { AutomationNote, ChallengeReadout } from '@/pages/playground/widgets/ChallengeChrome'
import { VariantCard } from '@/pages/playground/widgets/WidgetChrome'

const menuButtonClass =
  'block w-full px-3 py-1.5 text-left text-sm text-mist-200 hover:bg-ink-700 hover:text-mist-50'

/** E.4 — pure-CSS nested hover menu (submenu appears on :hover/:focus-within). */
export function HoverMenu() {
  const [selection, setSelection] = useState('none')

  return (
    <VariantCard name="5. Hover menu (pure CSS, nested)" verdict="challenge">
      <p className="text-xs text-mist-400">
        CSS :hover and :focus-within are the only things that reveal the submenu. There is no
        click handler to cheat with, so you have to hover the whole chain.
      </p>
      <nav aria-label="Hover menu demo" className="relative z-10">
        <div className="group/menu relative inline-block">
          <span className="inline-flex cursor-default items-center gap-1 rounded-lg border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm text-mist-200">
            Products <span aria-hidden="true">▾</span>
          </span>
          <ul className="absolute left-0 top-full hidden w-48 rounded-lg border border-ink-600 bg-ink-800 py-1 shadow-xl group-focus-within/menu:block group-hover/menu:block">
            <li>
              <button type="button" className={menuButtonClass} onClick={() => setSelection('Overview')}>
                Overview
              </button>
            </li>
            <li className="group/sub relative">
              <span className="flex cursor-default items-center justify-between px-3 py-1.5 text-sm text-mist-200 group-hover/sub:bg-ink-700">
                Integrations <span aria-hidden="true">▸</span>
              </span>
              <ul className="absolute left-full top-0 hidden w-48 rounded-lg border border-ink-600 bg-ink-800 py-1 shadow-xl group-focus-within/sub:block group-hover/sub:block">
                <li>
                  <button type="button" className={menuButtonClass} onClick={() => setSelection('Selenium bridge')}>
                    Selenium bridge
                  </button>
                </li>
                <li>
                  <button type="button" className={menuButtonClass} onClick={() => setSelection('Playwright adapter')}>
                    Playwright adapter
                  </button>
                </li>
              </ul>
            </li>
            <li>
              <button type="button" className={menuButtonClass} onClick={() => setSelection('Pricing')}>
                Pricing
              </button>
            </li>
          </ul>
        </div>
      </nav>
      <ChallengeReadout testId="interactions-hover-readout" label="Selected" value={selection} />
      <AutomationNote>
        Hover the trigger, then the &quot;Integrations&quot; row, then click the entry. That is{' '}
        <code>locator.hover()</code> twice in Playwright, or chained{' '}
        <code>Actions.moveToElement()</code> calls in Selenium. Jump the mouse straight at the
        submenu and it closes before you get there.
      </AutomationNote>
    </VariantCard>
  )
}

const CONTEXT_ACTIONS = ['Copy', 'Rename', 'Delete'] as const

/** E.5 — right-click zone opens a custom context menu; actions are logged. */
export function ContextMenuZone() {
  const [menuAt, setMenuAt] = useState<{ x: number; y: number } | null>(null)
  const [log, setLog] = useState<{ id: number; text: string }[]>([])
  const nextEntryId = useRef(1)

  function onContextMenu(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    setMenuAt({ x: event.clientX - rect.left, y: event.clientY - rect.top })
  }

  function choose(action: string) {
    const id = nextEntryId.current
    nextEntryId.current += 1
    setLog((current) => [...current, { id, text: `${action} @ ${new Date().toLocaleTimeString()}` }])
    setMenuAt(null)
  }

  return (
    <VariantCard name="6. Context menu (right-click)" verdict="challenge">
      <div className="relative">
        <button
          type="button"
          data-testid="interactions-context-zone"
          aria-label="Right-click zone"
          onContextMenu={onContextMenu}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setMenuAt(null)
          }}
          className="flex h-28 w-full cursor-context-menu items-center justify-center rounded-xl border-2 border-dashed border-ink-600 bg-ink-950/40 text-sm text-mist-400"
        >
          Right-click anywhere in this zone
        </button>
        {menuAt ? (
          <ul
            role="menu"
            aria-label="Zone actions"
            className="absolute z-20 w-36 rounded-lg border border-ink-600 bg-ink-800 py-1 shadow-xl"
            style={{ left: menuAt.x, top: menuAt.y }}
          >
            {CONTEXT_ACTIONS.map((action) => (
              <li key={action} role="none">
                <button type="button" role="menuitem" className={menuButtonClass} onClick={() => choose(action)}>
                  {action}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-mist-500">Action log</p>
        <ul
          data-testid="interactions-context-log"
          aria-label="Context action log"
          className="mt-1 min-h-8 space-y-1 text-xs text-mist-300"
        >
          {log.map((entry) => (
            <li key={entry.id} className="rounded border border-ink-700 bg-ink-950/60 px-2 py-1 font-mono">
              {entry.text}
            </li>
          ))}
        </ul>
      </div>
      <AutomationNote>
        Right-click via <code>locator.click({'{'} button: &apos;right&apos; {'}'})</code>{' '}
        (Playwright) or <code>Actions.contextClick()</code> (Selenium), then click the menu item
        and assert the log grew by one entry.
      </AutomationNote>
    </VariantCard>
  )
}
