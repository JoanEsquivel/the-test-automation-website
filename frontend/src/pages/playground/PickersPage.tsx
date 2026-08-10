import { useState } from 'react'

import { PageIntro } from '@/components/ui/PageIntro'
import { DifficultySelector } from '@/playground/DifficultySelector'
import { useLocatorAttrs, withClass } from '@/playground/locators'
import { CalendarGrid } from '@/pages/playground/widgets/pickers/CalendarGrid'
import { Readout, VariantCard, WidgetSection } from '@/pages/playground/widgets/WidgetChrome'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const YEARS = ['2024', '2025', '2026', '2027']
const BROWSERS = ['Chromium', 'Firefox', 'WebKit', 'Edge', 'Opera']

const fieldClass =
  'w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm text-mist-100'

function NativeDateCard() {
  const attrs = useLocatorAttrs()
  const [date, setDate] = useState('')
  return (
    <VariantCard name='<input type="date">' verdict="recommended">
      <label className="flex flex-col gap-1 text-xs font-medium text-mist-400">
        Pick a date
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          {...withClass(attrs('pickers-native-date', { name: 'date', className: 'input-date' }), fieldClass)}
        />
      </label>
      <p className="text-xs text-mist-500">
        Do not fight the browser popup. Set the value directly with fill() or sendKeys() using ISO
        yyyy-mm-dd and let the change event fire.
      </p>
      <Readout testId="pickers-native-readout" label="Date" value={date || 'none'} />
    </VariantCard>
  )
}

function LegacyDmyCard() {
  const attrs = useLocatorAttrs()
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const composed =
    day && month && year
      ? `${year}-${String(MONTHS.indexOf(month) + 1).padStart(2, '0')}-${day.padStart(2, '0')}`
      : 'incomplete'
  return (
    <VariantCard name="Three D/M/Y <select>s" verdict="legacy">
      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-mist-400">
          Day
          <select
            value={day}
            onChange={(event) => setDay(event.target.value)}
            {...withClass(attrs('pickers-legacy-day', { name: 'day', className: 'select-day' }), fieldClass)}
          >
            <option value="">—</option>
            {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-mist-400">
          Month
          <select
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            {...withClass(attrs('pickers-legacy-month', { name: 'month', className: 'select-month' }), fieldClass)}
          >
            <option value="">—</option>
            {MONTHS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-mist-400">
          Year
          <select
            value={year}
            onChange={(event) => setYear(event.target.value)}
            {...withClass(attrs('pickers-legacy-year', { name: 'year', className: 'select-year' }), fieldClass)}
          >
            <option value="">—</option>
            {YEARS.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-xs text-mist-500">
        Three selects, zero validation. February 31st is selectable. You have booked a flight on
        one of these.
      </p>
      <Readout testId="pickers-legacy-readout" label="Date" value={composed} />
    </VariantCard>
  )
}

function NativeExtrasCard() {
  const attrs = useLocatorAttrs()
  const [color, setColor] = useState('#06b6d4')
  const [browser, setBrowser] = useState('')
  return (
    <VariantCard name="<input type=color> + <datalist> autocomplete" verdict="recommended">
      <label className="flex items-center gap-3 text-xs font-medium text-mist-400">
        Favorite color
        <input
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          {...withClass(
            attrs('pickers-color', { name: 'color', className: 'input-color' }),
            'h-8 w-14 cursor-pointer rounded border border-ink-600 bg-ink-800',
          )}
        />
      </label>
      <Readout testId="pickers-color-readout" label="Color" value={color} />
      <label className="flex flex-col gap-1 text-xs font-medium text-mist-400">
        Browser (datalist suggestions)
        <input
          type="text"
          list="pickers-browser-options"
          value={browser}
          onChange={(event) => setBrowser(event.target.value)}
          {...withClass(attrs('pickers-datalist', { name: 'browser', className: 'input-browser' }), fieldClass)}
        />
      </label>
      <datalist id="pickers-browser-options">
        {BROWSERS.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </datalist>
      <Readout testId="pickers-datalist-readout" label="Browser" value={browser || 'none'} />
    </VariantCard>
  )
}

export default function PickersPage() {
  return (
    <div>
      <PageIntro
        title="Pickers"
        what="Three ways to pick a date: the native input, a custom ARIA calendar grid, and the old trio of day/month/year selects. Plus the native color input and datalist autocomplete."
        how="Set the same date in all three and compare what it cost you: one fill() against a whole choreography of clicks through the calendar popup. Every card has a Date readout."
      />
      <DifficultySelector />

      <WidgetSection
        title="Date picker"
        description="The native input wins on keyboards, locales and validation, and you get all of it for free. The calendar grid is what design systems ship anyway. The triple select is what you inherit."
      >
        <NativeDateCard />
        <VariantCard name='Custom calendar popup (role="grid")' verdict="ariaCustom">
          <CalendarGrid />
        </VariantCard>
        <LegacyDmyCard />
      </WidgetSection>

      <WidgetSection
        title="Native extras"
        description="Two built-ins worth automating once so they never surprise you: the color swatch popup and datalist autocomplete."
        columns="md:grid-cols-2"
      >
        <NativeExtrasCard />
      </WidgetSection>
    </div>
  )
}
