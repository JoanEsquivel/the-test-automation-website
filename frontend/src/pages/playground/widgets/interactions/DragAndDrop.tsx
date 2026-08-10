import { useEffect, useState, type DragEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { AutomationNote, ChallengeReadout } from '@/pages/playground/widgets/ChallengeChrome'
import { VariantCard } from '@/pages/playground/widgets/WidgetChrome'

const CARDS = ['Amber', 'Beryl', 'Coral'] as const
type CardName = (typeof CARDS)[number]

const SLOT_KEYS = ['slot-1', 'slot-2', 'slot-3']

/** E.1a — HTML5 draggable cards into ordered slots. */
export function Html5DragDrop() {
  const [slots, setSlots] = useState<(CardName | null)[]>([null, null, null])

  const unplaced = CARDS.filter((card) => !slots.includes(card))

  function onDrop(slotIndex: number) {
    return (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      const card = event.dataTransfer.getData('text/plain') as CardName
      if (!CARDS.includes(card)) return
      setSlots((current) =>
        current.map((occupant, index) =>
          index === slotIndex ? card : occupant === card ? null : occupant,
        ),
      )
    }
  }

  return (
    <VariantCard name="1. HTML5 drag & drop (draggable + drop targets)" verdict="challenge">
      <p className="text-xs text-mist-400">
        Drag each card into a slot. HTML5 drag-and-drop fires dragstart/dragover/drop — some
        drivers need synthetic events for this flavor.
      </p>
      <div className="flex gap-2">
        {unplaced.map((card) => (
          <div
            key={card}
            draggable
            aria-label={`Draggable card ${card}`}
            onDragStart={(event) => event.dataTransfer.setData('text/plain', card)}
            className="cursor-grab rounded-lg border border-pulse-500/40 bg-pulse-500/10 px-3 py-2 text-sm font-medium text-pulse-300"
          >
            {card}
          </div>
        ))}
        {unplaced.length === 0 ? (
          <p className="text-xs text-mist-500">All cards placed.</p>
        ) : null}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {SLOT_KEYS.map((slotKey, index) => {
          const occupant = slots[index]
          return (
            <div
              key={slotKey}
              aria-label={`Drop slot ${index + 1}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={onDrop(index)}
              className={`flex h-14 items-center justify-center rounded-lg border-2 border-dashed text-sm ${
                occupant
                  ? 'border-volt-500/50 bg-volt-500/10 text-volt-300'
                  : 'border-ink-600 text-mist-500'
              }`}
            >
              {occupant ?? `Slot ${index + 1}`}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-3">
        <Button size="sm" variant="ghost" onClick={() => setSlots([null, null, null])}>
          Reset
        </Button>
      </div>
      <ChallengeReadout
        testId="interactions-dnd-readout"
        label="Slot order"
        value={slots.map((slot) => slot ?? '—').join(', ')}
      />
      <AutomationNote>
        Playwright&apos;s <code>locator.dragTo(target)</code> handles HTML5 dnd. If it flakes,
        dispatch the dragstart/dragover/drop sequence manually with a shared DataTransfer.
        Always assert the readout, not the pixels.
      </AutomationNote>
    </VariantCard>
  )
}

const SORTABLE_START = ['Red', 'Green', 'Blue', 'Yellow']

/** E.1b — pointer-event sortable list (NOT HTML5 dnd: needs real mouse moves). */
export function PointerSortable() {
  const [items, setItems] = useState(SORTABLE_START)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  useEffect(() => {
    if (dragIndex === null) return undefined
    const stop = () => setDragIndex(null)
    window.addEventListener('pointerup', stop)
    return () => window.removeEventListener('pointerup', stop)
  }, [dragIndex])

  function moveTo(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return
    setItems((current) => {
      const next = [...current]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
    setDragIndex(targetIndex)
  }

  return (
    <VariantCard name="2. Pointer-based sortable list (mousedown → move → up)" verdict="challenge">
      <p className="text-xs text-mist-400">
        No draggable attribute here — reordering listens to raw pointer events. Press an item,
        move over another, release. Tools need genuine mouse-action sequences.
      </p>
      <ul className="select-none divide-y divide-ink-700 rounded-lg border border-ink-700">
        {items.map((item, index) => (
          <li
            key={item}
            aria-label={`Sortable item ${item}`}
            onPointerDown={(event) => {
              event.preventDefault()
              setDragIndex(index)
            }}
            onPointerEnter={() => moveTo(index)}
            className={`cursor-grab px-3 py-2 text-sm ${
              dragIndex === index ? 'bg-pulse-500/20 text-pulse-200' : 'text-mist-200'
            }`}
          >
            ⠿ {item}
          </li>
        ))}
      </ul>
      <Button size="sm" variant="ghost" onClick={() => setItems(SORTABLE_START)}>
        Reset order
      </Button>
      <ChallengeReadout testId="interactions-sortable-readout" label="Order" value={items.join(', ')} />
      <AutomationNote>
        Use the low-level mouse API: <code>page.mouse.down()</code>, several{' '}
        <code>mouse.move()</code> steps, <code>mouse.up()</code> (Playwright) or Selenium&apos;s{' '}
        <code>Actions.clickAndHold().moveToElement().release()</code>. One-step teleports often
        skip the pointerenter the widget listens for.
      </AutomationNote>
    </VariantCard>
  )
}
