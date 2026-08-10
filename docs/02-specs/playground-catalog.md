# Spec — Components Playground Catalog

> Normative matrix of every playground page: widgets × implementation variants × locator
> difficulty. Every page renders a `PageIntro` (what it is, how to use it, what to try) and a
> **difficulty selector**; every variant card shows an implementation label, and exactly one
> variant per widget carries the **"Recommended" badge** (the correct modern implementation).

## Locator difficulty levels (global)

A page-level segmented control (`data-testid="difficulty-selector"`, always easy-locatable)
switches the attributes rendered on all widgets of the page via `useLocatorAttrs(level)`:

| Level | What the DOM offers |
|---|---|
| **Easy** | `data-testid="<stable-id>"`, plus `id`, `name`, ARIA labels |
| **Medium** | No test ids. Stable semantic class names (`.product-card__title`), labels, roles |
| **Evil** | Dynamic ids regenerated on every mount (`id="x-8f2ka"`), obfuscated hashed classes (`.css-1x2y3z`), no test ids; structure/text is the only stable anchor |

The current level is persisted in localStorage (`taw:difficulty`) and shown as a pill.

## Route map

`/playground` — hub page listing all categories (cards with descriptions).
`/playground/<category>` — one page per category below.
`/frames/*` — bare pages (no app chrome) embedded by the iframe challenges.

## A. Form element variants (`/playground/forms`, `/playground/dropdowns`, `/playground/pickers`)

| Widget | Variants | Recommended |
|---|---|---|
| Checkbox | 1. Native `<input type=checkbox>` + `<label>` 2. Legacy div-with-background-image fake checkbox (click handler on `<div>`) 3. ARIA `role="checkbox"` custom styled | **1** — native + label |
| Radio group | 1. Native radios in `<fieldset>` 2. Button-group acting as radios (no radio semantics) 3. ARIA `role="radiogroup"` roving-tabindex | **1** |
| Text inputs | 1. Labeled inputs (email, password w/ reveal, number, masked phone) 2. Placeholder-only unlabeled inputs 3. `contenteditable` div posing as input | **1** |
| Toggle/switch | 1. `role="switch"` button 2. Checkbox hack with CSS 3. jQuery-era sliding div | **1** |
| Dropdown | 1. Native `<select>` (single + multiple) 2. Custom ARIA listbox (keyboard support) 3. Searchable combobox (`role="combobox"`, async-filtered options) 4. Legacy hover `<ul>` fake dropdown | **1** for plain choice, **3** flagged "recommended when search is needed" |
| Date picker | 1. Native `<input type=date>` 2. Custom calendar popup grid (`role="grid"`) 3. Three separate D/M/Y selects (legacy) | **1** |
| File & misc | color, range (see Interaction), autocomplete `<datalist>` | native |

Each variants page ends with a **"Verify your work" form**: a submit button renders a summary of
the current values (`data-testid="form-summary"` at easy level) so scripts can assert outcomes.

## B. Data display (`/playground/tables`, `/playground/modals`, `/playground/navigation`)

| Widget | Variants | Recommended |
|---|---|---|
| Table | 1. Semantic `<table>` sortable + paginated (server-style paging of seed products) 2. Div-grid fake table 3. Editable cells table (double-click to edit) | **1** |
| Modal | 1. Native `<dialog showModal>` 2. React portal overlay w/ focus trap 3. Legacy inline `display:none` toggle (no focus management) | **1** |
| Tabs | 1. ARIA tabs pattern 2. Anchor-link + `:target` CSS tabs | **1** |
| Accordion | 1. `<details>/<summary>` 2. ARIA disclosure buttons 3. jQuery-style slide div | **1** |
| Tooltip/popover | 1. `popover` attribute API 2. title attribute 3. hover div | **1** |
| Breadcrumb + pagination widgets | semantic `<nav>` | — |

## C. Dynamic & async challenges (`/playground/dynamic`)

All delays configurable via a slider (0.5–10 s, `data-testid="delay-slider"`); defaults 2 s.

1. **Delayed appearance** — button spawns an element after the delay (tests explicit waits).
2. **Delayed enable** — input/button disabled until the delay elapses.
3. **Spinner then content** — skeleton/spinner replaced by loaded card.
4. **Stale element trap** — a list that fully re-renders (new DOM nodes) every N seconds; holding
   a reference across re-render throws StaleElementReference in Selenium.
5. **Appear/disappear toast** — auto-dismissing toasts (success/error) with progress bar.
6. **Infinite scroll** — feed loading 10 items per viewport-bottom hit, up to 100.
7. **Progress bar** — starts on click, completes after the delay, fires a completion banner.
8. **Text swap** — element whose text changes ("Loading…" → "Ready") without node replacement.

## D. Structural challenges (`/playground/frames`, `/playground/shadow`, `/playground/windows`, `/playground/files`)

1. **Iframes**: page embeds `/frames/inner-form` (a small form) and `/frames/outer` which itself
   embeds `/frames/inner-form` (**nested** iframe). Submissions render inside the frame.
2. **Shadow DOM**: custom elements from `shadow-widgets.ts` — `<taw-shadow-input>` (open root),
   `<taw-shadow-counter>` (open, nested shadow), `<taw-shadow-vault>` (**closed** root — the evil
   case; page explains why closed roots are near-unautomatable and how apps expose hooks).
3. **Windows/tabs**: `target=_blank` link, `window.open` popup (small window), and a button that
   opens `/frames/result` in a new tab which writes a value the opener page then displays.
4. **Native dialogs**: `alert()`, `confirm()` (result shown on page), `prompt()` (echoes input),
   plus `beforeunload` demo (opt-in checkbox).
5. **Files**: download the CSV/PDF from the Files API; upload with drag-drop zone + classic
   `<input type=file>`; server echo (`fileName`, `sizeBytes`) rendered for assertions.

## E. Interaction challenges (`/playground/interactions`)

1. **Drag & drop**: HTML5 draggable cards into ordered slots (verifiable order readout) + a
   pointer-events sortable list (non-HTML5, needs mouse actions).
2. **Sliders**: native `<input type=range>` (value readout) + custom ARIA slider (keyboard arrows).
3. **Canvas pad**: draw with mouse; "stroke count" + last coordinates readout for assertions.
4. **Hover menu**: pure-CSS nested menu (only reachable via real hover).
5. **Context menu**: right-click zone opens custom menu; chosen action logged to a visible list.
6. **Keyboard-only widget**: a listbox that ignores mouse clicks entirely (keyboard navigation
   practice); selected item readout.
7. **Double/long press**: double-click cell and press-and-hold button (fires after 800 ms).

## F. Hub extras

- `/playground` hub shows an **"Automation cheat-sheet"** per category (which tool APIs map to
  which challenge — e.g. Playwright `frameLocator`, Selenium `switchTo().frame()`).
- Every challenge card includes an expandable **"What good automation looks like"** note.

## Acceptance criteria (ATDD anchors)

- Every widget variant is operable and its outcome observable in the DOM (a readout/summary node).
- Difficulty selector changes locator attributes without breaking functionality.
- Exactly one Recommended badge per widget row.
- All pages keyboard-accessible in their recommended variant.
- jsdom-untestable items (iframes, shadow closed root, new windows, downloads) are covered by
  Playwright specs instead of Vitest.
