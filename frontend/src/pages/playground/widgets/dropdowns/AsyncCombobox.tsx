import { useEffect, useId, useRef, useState } from 'react'

import { useLocatorAttrs, withClass } from '@/playground/locators'
import { Readout } from '@/pages/playground/widgets/WidgetChrome'

export const COUNTRIES = [
  'Madagascar',
  'Malaysia',
  'Mali',
  'Malta',
  'Mexico',
  'Norway',
  'Portugal',
  'Singapore',
]

const SEARCH_DELAY_MS = 300

/**
 * Searchable combobox with ASYNC filtering: options arrive ~300 ms after the last
 * keystroke, so naive scripts that query synchronously will miss them.
 */
export function AsyncCombobox() {
  const attrs = useLocatorAttrs()
  const listId = useId()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<string[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [active, setActive] = useState(0)
  const [value, setValue] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const search = (text: string) => {
    setQuery(text)
    clearTimeout(timerRef.current)
    if (text.trim() === '') {
      setResults(null)
      setSearching(false)
      return
    }
    setSearching(true)
    timerRef.current = setTimeout(() => {
      const needle = text.trim().toLowerCase()
      setResults(COUNTRIES.filter((c) => c.toLowerCase().includes(needle)))
      setActive(0)
      setSearching(false)
    }, SEARCH_DELAY_MS)
  }

  const select = (country: string) => {
    setValue(country)
    setQuery(country)
    setResults(null)
  }

  return (
    <div className="relative">
      <label className="flex flex-col gap-1 text-xs font-medium text-mist-400">
        Search country
        <input
          type="text"
          role="combobox"
          aria-expanded={results !== null}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          value={query}
          onChange={(event) => search(event.target.value)}
          onKeyDown={(event) => {
            if (!results || results.length === 0) return
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setActive((i) => Math.min(i + 1, results.length - 1))
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              setActive((i) => Math.max(i - 1, 0))
            } else if (event.key === 'Enter') {
              event.preventDefault()
              select(results[active])
            } else if (event.key === 'Escape') {
              setResults(null)
            }
          }}
          {...withClass(
            attrs('dropdowns-combobox-input', { name: 'countrySearch', className: 'combobox-input' }),
            'w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm text-mist-100 placeholder:text-mist-500',
          )}
          placeholder="Type to search…"
        />
      </label>
      <p role="status" aria-live="polite" className="mt-1 h-4 text-xs text-mist-500">
        {searching ? 'Searching…' : ''}
      </p>
      {results !== null && (
        // oxlint-disable-next-line no-noninteractive-element-to-interactive-role -- canonical WAI-ARIA combobox popup: ul[role=listbox] with li[role=option]
        <ul role="listbox"
          id={listId}
          aria-label="Country suggestions"
          className="absolute z-10 mt-1 w-full rounded-lg border border-ink-600 bg-ink-800 py-1 shadow-xl"
        >
          {results.length === 0 && <li className="px-3 py-1.5 text-sm text-mist-500">No matches</li>}
          {results.map((country, index) => (
            // oxlint-disable-next-line click-events-have-key-events, no-noninteractive-element-to-interactive-role -- canonical ARIA option: keyboard is handled on the combobox input
            <li role="option"
              key={country}
              aria-selected={value === country}
              onClick={() => select(country)}
              className={`cursor-pointer px-3 py-1.5 text-sm ${
                index === active ? 'bg-volt-500/20 text-volt-300' : 'text-mist-200'
              }`}
            >
              {country}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2">
        <Readout testId="dropdowns-combobox-readout" label="Selected" value={value || 'none'} />
      </div>
    </div>
  )
}
