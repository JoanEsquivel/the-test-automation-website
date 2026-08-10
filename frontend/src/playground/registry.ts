export interface PlaygroundCategory {
  slug: string
  title: string
  emoji: string
  description: string
  path: string
  /** Pages for these arrive in the automation-challenges phase. */
  comingSoon?: boolean
}

/** Single source of truth for the playground hub cards and category routes. */
export const PLAYGROUND_CATEGORIES: PlaygroundCategory[] = [
  {
    slug: 'forms',
    title: 'Forms',
    emoji: '📝',
    description: 'Checkboxes, radios, text inputs and switches — native, ARIA and legacy variants.',
    path: '/playground/forms',
  },
  {
    slug: 'dropdowns',
    title: 'Dropdowns',
    emoji: '🔽',
    description: 'Native selects, an ARIA listbox, an async searchable combobox and a hover relic.',
    path: '/playground/dropdowns',
  },
  {
    slug: 'pickers',
    title: 'Pickers',
    emoji: '📅',
    description: 'Date pickers three ways, plus native color and datalist autocomplete.',
    path: '/playground/pickers',
  },
  {
    slug: 'tables',
    title: 'Tables',
    emoji: '📊',
    description: 'Sortable, paginated product table vs a div-grid fake, plus editable cells.',
    path: '/playground/tables',
  },
  {
    slug: 'modals',
    title: 'Modals & popovers',
    emoji: '🪟',
    description: 'Native dialog, portal overlay with focus trap, legacy toggles and tooltips.',
    path: '/playground/modals',
  },
  {
    slug: 'navigation',
    title: 'Navigation',
    emoji: '🧭',
    description: 'Tabs, accordions, breadcrumbs and pagination — accessible and otherwise.',
    path: '/playground/navigation',
  },
  {
    slug: 'dynamic',
    title: 'Dynamic & async',
    emoji: '⏳',
    description: 'Delays, spinners, stale elements, toasts, infinite scroll and progress bars.',
    path: '/playground/dynamic',
    comingSoon: true,
  },
  {
    slug: 'frames',
    title: 'Iframes',
    emoji: '🖼️',
    description: 'Simple and nested iframes with forms submitting inside the frame.',
    path: '/playground/frames',
    comingSoon: true,
  },
  {
    slug: 'shadow',
    title: 'Shadow DOM',
    emoji: '👥',
    description: 'Open, nested and closed shadow roots — including the near-unautomatable case.',
    path: '/playground/shadow',
    comingSoon: true,
  },
  {
    slug: 'windows',
    title: 'Windows & dialogs',
    emoji: '🗔',
    description: 'New tabs, popups and native alert/confirm/prompt handling.',
    path: '/playground/windows',
    comingSoon: true,
  },
  {
    slug: 'files',
    title: 'Files',
    emoji: '📁',
    description: 'Downloads and uploads with drag-drop plus a server echo for assertions.',
    path: '/playground/files',
    comingSoon: true,
  },
  {
    slug: 'interactions',
    title: 'Interactions',
    emoji: '🖱️',
    description: 'Drag & drop, sliders, canvas, hover menus, context menus and long presses.',
    path: '/playground/interactions',
    comingSoon: true,
  },
]
