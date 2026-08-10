import { useState } from 'react'

import { useLocatorAttrs, withClass } from '@/playground/locators'
import { Readout } from '@/pages/playground/widgets/WidgetChrome'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

interface CalendarCell {
  key: string
  day: number | null
}

interface CalendarWeek {
  key: string
  cells: CalendarCell[]
}

/** Weeks matrix for a month with data-derived keys; null day = filler cell. */
function monthWeeks(year: number, month: number): CalendarWeek[] {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7 // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: CalendarWeek[] = []
  for (let i = 0; i < cells.length; i += 7) {
    const slice = cells.slice(i, i + 7)
    const firstDay = slice.find((d) => d !== null)
    weeks.push({
      key: `week-of-${firstDay}`,
      cells: slice.map((day, slot) => ({
        key: day === null ? `blank-${WEEKDAYS[slot]}-${firstDay}` : `day-${day}`,
        day,
      })),
    })
  }
  return weeks
}

/** Custom calendar popup: role="grid" with month navigation and day buttons. */
export function CalendarGrid() {
  const attrs = useLocatorAttrs()
  const [open, setOpen] = useState(false)
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selected, setSelected] = useState('')

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
  }

  const pick = (day: number) => {
    setSelected(`${year}-${pad(month + 1)}-${pad(day)}`)
    setOpen(false)
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        {...withClass(
          attrs('pickers-calendar-trigger', { className: 'calendar-trigger' }),
          'rounded-lg border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm',
        )}
      >
        {open ? 'Close calendar' : 'Open calendar'}
        {selected ? ` — ${selected}` : ''}
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-ink-600 bg-ink-800 p-3">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
              className="rounded px-2 py-0.5 text-mist-300 hover:bg-ink-700"
            >
              ←
            </button>
            <span className="text-sm font-semibold">
              {MONTHS[month]} {year}
            </span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
              className="rounded px-2 py-0.5 text-mist-300 hover:bg-ink-700"
            >
              →
            </button>
          </div>
          <div role="grid" aria-label={`${MONTHS[month]} ${year}`}>
            <div role="row" className="grid grid-cols-7 text-center text-[10px] font-semibold uppercase text-mist-500">
              {WEEKDAYS.map((d) => (
                <span key={d} role="columnheader" className="py-1">
                  {d}
                </span>
              ))}
            </div>
            {monthWeeks(year, month).map((week) => (
              <div role="row" key={week.key} className="grid grid-cols-7">
                {week.cells.map((cell) =>
                  cell.day === null ? (
                    <span role="gridcell" aria-hidden="true" key={cell.key} />
                  ) : (
                    <span role="gridcell" key={cell.key} className="text-center">
                      <button
                        type="button"
                        aria-label={`Day ${cell.day}`}
                        onClick={() => pick(cell.day as number)}
                        className={`m-0.5 size-7 rounded text-xs ${
                          selected.endsWith(`-${pad(cell.day)}`) &&
                          selected.startsWith(`${year}-${pad(month + 1)}`)
                            ? 'bg-volt-500 font-bold text-ink-950'
                            : 'text-mist-200 hover:bg-ink-700'
                        }`}
                      >
                        {cell.day}
                      </button>
                    </span>
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-3">
        <Readout testId="pickers-calendar-readout" label="Date" value={selected || 'none'} />
      </div>
    </div>
  )
}
