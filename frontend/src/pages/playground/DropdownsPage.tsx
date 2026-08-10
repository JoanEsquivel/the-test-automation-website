import { useState } from 'react'

import { PageIntro } from '@/components/ui/PageIntro'
import { DifficultySelector } from '@/playground/DifficultySelector'
import { useLocatorAttrs, withClass } from '@/playground/locators'
import { AriaListbox } from '@/pages/playground/widgets/dropdowns/AriaListbox'
import { AsyncCombobox } from '@/pages/playground/widgets/dropdowns/AsyncCombobox'
import { Readout, VariantCard, WidgetSection } from '@/pages/playground/widgets/WidgetChrome'

const FRUITS = ['Apple', 'Banana', 'Cherry', 'Mango', 'Papaya', 'Strawberry']
const TOPPINGS = ['Granola', 'Honey', 'Coconut', 'Cacao nibs']
const LEGACY_ITEMS = ['Reports', 'Exports', 'Settings']

const selectClass =
  'w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm text-mist-100'

function NativeSelectsCard() {
  const attrs = useLocatorAttrs()
  const [fruit, setFruit] = useState('')
  const [toppings, setToppings] = useState<string[]>([])

  return (
    <VariantCard name="<select> — single & multiple" verdict="recommended">
      <label className="flex flex-col gap-1 text-xs font-medium text-mist-400">
        Favorite fruit
        <select
          value={fruit}
          onChange={(event) => setFruit(event.target.value)}
          {...withClass(attrs('dropdowns-native-select', { name: 'fruit', className: 'select-fruit' }), selectClass)}
        >
          <option value="">— pick one —</option>
          {FRUITS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </label>
      <Readout testId="dropdowns-native-readout" label="Selected" value={fruit || 'none'} />
      <label className="flex flex-col gap-1 text-xs font-medium text-mist-400">
        Toppings (multiple)
        <select
          multiple
          size={4}
          value={toppings}
          onChange={(event) =>
            setToppings(Array.from(event.target.selectedOptions, (option) => option.value))
          }
          {...withClass(
            attrs('dropdowns-native-multi', { name: 'toppings', className: 'select-toppings' }),
            selectClass,
          )}
        >
          {TOPPINGS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <Readout testId="dropdowns-multi-readout" label="Toppings" value={toppings.join(', ') || 'none'} />
    </VariantCard>
  )
}

function HoverDropdownCard() {
  const attrs = useLocatorAttrs()
  const [choice, setChoice] = useState('')

  return (
    <VariantCard name="Legacy hover <ul> menu" verdict="legacy">
      <div className="group relative">
        <span
          {...withClass(
            attrs('dropdowns-hover-trigger', { className: 'hover-menu-trigger' }),
            'inline-flex w-full cursor-default items-center justify-between rounded-lg border border-dashed border-ink-600 bg-ink-800 px-3 py-1.5 text-sm text-mist-300',
          )}
        >
          Hover to open menu <span aria-hidden="true">▾</span>
        </span>
        <ul className="absolute z-10 mt-1 hidden w-full rounded-lg border border-ink-600 bg-ink-800 py-1 shadow-xl group-hover:block">
          {LEGACY_ITEMS.map((item) => (
            // oxlint-disable-next-line click-events-have-key-events, no-noninteractive-element-interactions -- deliberate anti-pattern exhibit: hover-only menu with click handlers on bare li elements
            <li
              key={item}
              onClick={() => setChoice(item)}
              className="cursor-pointer px-3 py-1.5 text-sm text-mist-200 hover:bg-ink-700"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-mist-500">
        Opens on CSS :hover only — no click, no keyboard, no touch. Your tool needs real hover
        actions (Actions API / hover()) to reach the items.
      </p>
      <Readout testId="dropdowns-hover-readout" label="Selected" value={choice || 'none'} />
    </VariantCard>
  )
}

export default function DropdownsPage() {
  return (
    <div>
      <PageIntro
        title="Dropdowns"
        what="One widget, four implementations: native select, custom ARIA listbox, an async searchable combobox and a hover-only relic."
        how="Select a fruit natively, drive the listbox with arrow keys and Enter, then type in the combobox — its options arrive ~300 ms late on purpose, so your script must wait. Every card shows a Selected readout to assert."
      />
      <DifficultySelector />

      <WidgetSection
        title="Dropdown"
        description="Native select is the right answer for plain choice; the combobox is the right answer when search is needed. The rest is practice for the wild."
        columns="md:grid-cols-2"
      >
        <NativeSelectsCard />
        <VariantCard name='Custom ARIA listbox (button + ul[role="listbox"])' verdict="ariaCustom">
          <AriaListbox />
        </VariantCard>
        <VariantCard name='role="combobox" + async filtered options' verdict="recommendedSearch">
          <AsyncCombobox />
        </VariantCard>
        <HoverDropdownCard />
      </WidgetSection>
    </div>
  )
}
