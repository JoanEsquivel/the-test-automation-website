import { PageIntro } from '@/components/ui/PageIntro'
import { DifficultySelector } from '@/playground/DifficultySelector'
import { Html5DragDrop, PointerSortable } from '@/pages/playground/widgets/interactions/DragAndDrop'
import { ClickTimingChallenges, KeyboardOnlyListbox } from '@/pages/playground/widgets/interactions/KeyboardAndPresses'
import { ContextMenuZone, HoverMenu } from '@/pages/playground/widgets/interactions/Menus'
import { CanvasPad, Sliders } from '@/pages/playground/widgets/interactions/SlidersAndCanvas'
import { WidgetSection } from '@/pages/playground/widgets/WidgetChrome'

export default function InteractionsPage() {
  return (
    <div>
      <PageIntro
        title="Interaction challenges"
        what="Seven gesture challenges: HTML5 drag & drop, a pointer-event sortable, native and ARIA sliders, a canvas pad, a hover-only menu, a right-click menu, and widgets that only answer to the keyboard, a double-click or a long press."
        how="Drive each gesture with your tool's action API, then assert the readout. Every readout keeps its data-testid at all difficulty levels, so the gesture is the challenge, not the locator. If something works when you do it by hand but not from a script, you are almost certainly firing the start and end events without the moves in between."
      />
      <DifficultySelector />

      <WidgetSection
        title="Drag & drop"
        description="These look identical to a user and behave nothing alike to a driver: one runs on HTML5 dnd events, the other on raw pointer events. dragTo() handles one of them."
        columns="md:grid-cols-2"
      >
        <Html5DragDrop />
        <PointerSortable />
      </WidgetSection>

      <WidgetSection
        title="Sliders & canvas"
        description="Continuous controls: two slider implementations, and a canvas with no DOM inside it to locate."
        columns="md:grid-cols-2"
      >
        <Sliders />
        <CanvasPad />
      </WidgetSection>

      <WidgetSection
        title="Menus"
        description="Menus that need the pointer to behave like a real one: a pure-CSS hover reveal and a right-click context menu."
        columns="md:grid-cols-2"
      >
        <HoverMenu />
        <ContextMenuZone />
      </WidgetSection>

      <WidgetSection
        title="Keyboard & timing"
        description="A listbox the mouse cannot operate, a cell that needs a double-click, and a button you have to hold down."
        columns="md:grid-cols-2"
      >
        <KeyboardOnlyListbox />
        <ClickTimingChallenges />
      </WidgetSection>
    </div>
  )
}
