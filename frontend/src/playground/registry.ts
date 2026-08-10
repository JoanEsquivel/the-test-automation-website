export interface CheatSheetEntry {
  tool: string
  api: string
}

export interface PlaygroundCategory {
  slug: string
  title: string
  emoji: string
  description: string
  path: string
  /** Pages for these arrive in the automation-challenges phase. */
  comingSoon?: boolean
  /** Which tool APIs map to this category's challenges (hub cheat-sheet). */
  cheatSheet?: CheatSheetEntry[]
}

/** Single source of truth for the playground hub cards and category routes. */
export const PLAYGROUND_CATEGORIES: PlaygroundCategory[] = [
  {
    slug: 'forms',
    title: 'Forms',
    emoji: '📝',
    description: 'Checkboxes, radios, text inputs and switches. Native, ARIA and the legacy versions you still meet.',
    path: '/playground/forms',
  },
  {
    slug: 'dropdowns',
    title: 'Dropdowns',
    emoji: '🔽',
    description: 'A native select, an ARIA listbox, an async combobox, and a hover-only menu from 2009.',
    path: '/playground/dropdowns',
  },
  {
    slug: 'pickers',
    title: 'Pickers',
    emoji: '📅',
    description: 'Three ways to pick a date, plus the native color input and datalist autocomplete.',
    path: '/playground/pickers',
  },
  {
    slug: 'tables',
    title: 'Tables',
    emoji: '📊',
    description: 'A real sortable table, a div-grid pretending to be one, and cells you edit by double-click.',
    path: '/playground/tables',
  },
  {
    slug: 'modals',
    title: 'Modals & popovers',
    emoji: '🪟',
    description: 'Native dialog, portal overlay with a focus trap, a display:none relic, three tooltips.',
    path: '/playground/modals',
  },
  {
    slug: 'navigation',
    title: 'Navigation',
    emoji: '🧭',
    description: 'Tabs, accordions, breadcrumbs and pagination, done properly and done badly.',
    path: '/playground/navigation',
  },
  {
    slug: 'dynamic',
    title: 'Dynamic & async',
    emoji: '⏳',
    description: 'Delays, spinners, stale elements, toasts, infinite scroll, progress bars.',
    path: '/playground/dynamic',
    cheatSheet: [
      { tool: 'Playwright', api: 'expect(locator).toBeVisible() — assertions auto-wait' },
      { tool: 'Selenium', api: 'WebDriverWait + ExpectedConditions (never sleep())' },
    ],
  },
  {
    slug: 'frames',
    title: 'Iframes',
    emoji: '🖼️',
    description: 'One iframe, then an iframe inside an iframe. The forms submit inside the frame.',
    path: '/playground/frames',
    cheatSheet: [
      { tool: 'Playwright', api: "page.frameLocator('iframe[title=…]')" },
      { tool: 'Selenium', api: 'driver.switchTo().frame(…) / defaultContent()' },
    ],
  },
  {
    slug: 'shadow',
    title: 'Shadow DOM',
    emoji: '👥',
    description: 'Open roots, nested roots, and a closed root you basically cannot get into.',
    path: '/playground/shadow',
    cheatSheet: [
      { tool: 'Playwright', api: 'regular locators pierce open shadow roots automatically' },
      { tool: 'Selenium', api: 'element.getShadowRoot() (open roots only)' },
    ],
  },
  {
    slug: 'windows',
    title: 'Windows & dialogs',
    emoji: '🗔',
    description: 'New tabs, popup windows, and the native alert / confirm / prompt dialogs.',
    path: '/playground/windows',
    cheatSheet: [
      { tool: 'Playwright', api: "context.waitForEvent('page') + page.on('dialog')" },
      { tool: 'Selenium', api: 'getWindowHandles() + switchTo().window() / alert()' },
    ],
  },
  {
    slug: 'files',
    title: 'Files',
    emoji: '📁',
    description: 'Downloads, uploads, drag-drop upload, and a server echo you can assert against.',
    path: '/playground/files',
    cheatSheet: [
      { tool: 'Playwright', api: "page.waitForEvent('download') / setInputFiles()" },
      { tool: 'Selenium', api: 'sendKeys(absolutePath) on input[type=file]' },
    ],
  },
  {
    slug: 'interactions',
    title: 'Interactions',
    emoji: '🖱️',
    description: 'Drag & drop, sliders, canvas, hover menus, right-click menus, long presses.',
    path: '/playground/interactions',
    cheatSheet: [
      { tool: 'Playwright', api: 'locator.dragTo() / hover() / page.mouse API' },
      { tool: 'Selenium', api: 'Actions API — dragAndDrop, moveToElement, clickAndHold' },
    ],
  },
]
