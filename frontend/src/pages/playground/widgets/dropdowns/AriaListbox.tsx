import { useEffect, useId, useRef, useState } from 'react'

import { useLocatorAttrs, withClass } from '@/playground/locators'
import { Readout } from '@/pages/playground/widgets/WidgetChrome'

export const TOOLS = ['Playwright', 'Selenium', 'Cypress', 'WebdriverIO', 'Robot Framework']

/** Custom ARIA listbox: button trigger + ul[role=listbox], full keyboard support. */
export function AriaListbox() {
  const attrs = useLocatorAttrs()
  const idBase = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [value, setValue] = useState('')
  const listRef = useRef<HTMLUListElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) listRef.current?.focus()
  }, [open])

  const openList = () => {
    const selected = TOOLS.indexOf(value)
    setActive(selected >= 0 ? selected : 0)
    setOpen(true)
  }

  const select = (tool: string) => {
    setValue(tool)
    setOpen(false)
    buttonRef.current?.focus()
  }

  const close = () => {
    setOpen(false)
    buttonRef.current?.focus()
  }

  return (
    <div className="relative">
      <button
        type="button"
        ref={buttonRef}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? close() : openList())}
        onKeyDown={(event) => {
          if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault()
            openList()
          }
        }}
        {...withClass(
          attrs('dropdowns-listbox-trigger', { className: 'listbox-trigger' }),
          'flex w-full items-center justify-between gap-2 rounded-lg border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm',
        )}
      >
        <span>Choose a tool{value ? `: ${value}` : ''}</span>
        <span aria-hidden="true" className="text-mist-500">
          ▾
        </span>
      </button>
      {open && (
        // oxlint-disable-next-line no-noninteractive-element-to-interactive-role -- canonical WAI-ARIA listbox markup: ul[role=listbox] with li[role=option]
        <ul role="listbox"
          aria-label="Automation tools"
          tabIndex={-1}
          ref={listRef}
          aria-activedescendant={`${idBase}-opt-${active}`}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setActive((i) => Math.min(i + 1, TOOLS.length - 1))
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              setActive((i) => Math.max(i - 1, 0))
            } else if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              select(TOOLS[active])
            } else if (event.key === 'Escape') {
              event.preventDefault()
              close()
            }
          }}
          className="absolute z-10 mt-1 w-full rounded-lg border border-ink-600 bg-ink-800 py-1 shadow-xl outline-none"
        >
          {TOOLS.map((tool, index) => (
            // oxlint-disable-next-line click-events-have-key-events, no-noninteractive-element-to-interactive-role -- canonical ARIA option: keyboard is handled on the listbox via aria-activedescendant
            <li role="option"
              key={tool}
              id={`${idBase}-opt-${index}`}
              aria-selected={value === tool}
              onClick={() => select(tool)}
              className={`cursor-pointer px-3 py-1.5 text-sm ${
                index === active ? 'bg-volt-500/20 text-volt-300' : 'text-mist-200'
              }`}
            >
              {tool}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3">
        <Readout testId="dropdowns-listbox-readout" label="Selected" value={value || 'none'} />
      </div>
    </div>
  )
}
