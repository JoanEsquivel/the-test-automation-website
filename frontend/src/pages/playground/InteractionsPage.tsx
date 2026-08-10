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
        what="Seven gesture challenges: HTML5 drag & drop, a pointer-event sortable, native and ARIA sliders, a canvas pad, a hover-only menu, a right-click context menu, and keyboard/double-click/long-press widgets."
        how="Every widget mirrors its outcome to a readout with a stable data-testid at all difficulty levels — drive the gesture with your tool's action APIs, then assert the readout. If a gesture works by hand but not in your script, you are probably skipping the intermediate events."
      />
      <DifficultySelector />

      <WidgetSection
        title="Drag & drop"
        description="Two different technologies that look identical to users: HTML5 dnd events vs raw pointer events. They need different automation approaches."
        columns="md:grid-cols-2"
      >
        <Html5DragDrop />
        <PointerSortable />
      </WidgetSection>

      <WidgetSection
        title="Sliders & canvas"
        description="Continuous controls: two slider implementations and a canvas with no DOM inside."
        columns="md:grid-cols-2"
      >
        <Sliders />
        <CanvasPad />
      </WidgetSection>

      <WidgetSection
        title="Menus"
        description="Menus that require the pointer to behave like a real one: pure-CSS hover reveal and a right-click context menu."
        columns="md:grid-cols-2"
      >
        <HoverMenu />
        <ContextMenuZone />
      </WidgetSection>

      <WidgetSection
        title="Keyboard & timing"
        description="Input modality challenges: a mouse-proof listbox, a double-click cell and a press-and-hold button."
        columns="md:grid-cols-2"
      >
        <KeyboardOnlyListbox />
        <ClickTimingChallenges />
      </WidgetSection>
    </div>
  )
}
