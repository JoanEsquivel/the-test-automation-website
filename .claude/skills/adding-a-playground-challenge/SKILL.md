---
name: adding-a-playground-challenge
description: Use when adding or changing anything under frontend/src/pages/playground/, frontend/src/playground/ or frontend/src/pages/frames/ — a new widget variant, a new widget row, a new category page, a registry.ts entry, a hub cheat-sheet — or when touching useLocatorAttrs, withClass, DifficultySelector, easy/medium/evil difficulty, Recommended/Anti-pattern badges, shadow-widgets.ts, or an oxlint suppression on a deliberate anti-pattern exhibit.
---

# Adding a playground challenge

The playground exists so people can practise against markup that fights back. A widget here is not
"a component that works" — it is a set of implementations of the same control, labelled with a
verdict, wired to the locator difficulty system. Get the labelling or the locators wrong and the
page stops teaching anything.

`CLAUDE.md` carries the repo-wide rules (parity, base path, aliases, commands). This skill is only
about the playground half.

## What are you actually adding?

| Change | Files you touch |
|---|---|
| Another variant of an existing widget | the widget file under `frontend/src/pages/playground/widgets/<category>/` + its page test |
| A new widget row on an existing page | new file in `widgets/<category>/`, imported by the page, + page test |
| A whole new category | `playground/registry.ts`, `App.tsx`, new `pages/playground/XPage.tsx`, new `__tests__/XPage.test.tsx` |
| A challenge that needs a real browser | the page **plus** `e2e/tests/playground-structural.spec.ts` or `playground-interaction.spec.ts` |

## The locator difficulty system

`frontend/src/playground/locators.ts` exports `useLocatorAttrs()`, which returns an
`attrs(testId, opts)` function. Spread it onto the element:

```tsx
const attrs = useLocatorAttrs()
...
{...withClass(
  attrs('forms-switch-hack', { name: 'darkMode', className: 'switch-hack' }),
  'size-4 accent-volt-500',
)}
```

`withClass(attrs, styling)` merges the always-on Tailwind classes with the locator class, so the
widget looks identical at every level. Level comes from `useDifficultyStore`
(`frontend/src/playground/difficulty.ts`, zustand + `persist`, localStorage key `taw:difficulty`).

| Level | Emitted attributes |
|---|---|
| easy | `data-testid` + `id` + `name` + semantic `className` |
| medium | `name` + semantic `className` only — no test id, no id |
| evil | `id="x-<hash>"` and `className="css-<hash>"`, nothing else |

The evil hash is derived from a **per-mount random seed** (`useState(randomSeed)`), so every remount
produces different ids — imitating a hashed-classname build. That is the point: an evil-level
selector recorded once must never work twice.

Seventeen files under `frontend/src/pages/playground/` call the hook today. A new locator-puzzle
widget makes eighteen.

### When a raw `data-testid` is legitimate here

These are assertion targets, not locator puzzles. Do **not** put them behind the hook.

| Case | File |
|---|---|
| The difficulty selector itself, present at every level | `frontend/src/playground/DifficultySelector.tsx` (`data-testid="difficulty-selector"`) |
| Challenge readouts and chrome | `widgets/ChallengeChrome.tsx` (`ChallengeReadout`), `widgets/dynamic/AsyncFeedback.tsx`, `widgets/dynamic/DelayChallenges.tsx` |
| The bare frame pages | `frontend/src/pages/frames/InnerFormPage.tsx`, `OuterFramePage.tsx`, `FrameResultPage.tsx` |

`InnerFormPage.tsx` says it in a comment: "the challenge is SWITCHING INTO the frame, not locating
elements once inside." Same reasoning for the `/frames/*` siblings and for every timing challenge —
you are testing waits, structure or gestures, so the locator must not also be a puzzle.

Note the two readout components are not interchangeable: `Readout` (in `WidgetChrome.tsx`) honors
difficulty; `ChallengeReadout` (in `ChallengeChrome.tsx`) keeps its test id at all levels.

## Page anatomy

Every playground page is built the same way. Copy `frontend/src/pages/playground/FormsPage.tsx` for a
locator page or `FramesPage.tsx` for a challenge page.

1. `PageIntro` from `@/components/ui/PageIntro` with `title`, `what`, `how` — the self-describing
   rule. `how` is where the Playwright/Selenium instruction goes, in prose.
2. `<DifficultySelector />` from `@/playground/DifficultySelector`.
3. One `WidgetSection` per widget row (`title`, `description`, optional `columns`).
4. Inside it, one `VariantCard` per implementation — `name` is the implementation itself
   (`'<input type="checkbox"> + <label>'`), `verdict` is the badge key.
5. A `Readout` (or `ChallengeReadout`) in every card, so a script has something to assert on.
6. On challenge cards, an `AutomationNote` — the expandable `<details>` "What good automation looks
   like" block from `widgets/ChallengeChrome.tsx`.

## The Recommended badge rule

Verdicts live in one const object, `VERDICTS` in `frontend/src/pages/playground/widgets/WidgetChrome.tsx`:

| Key | Label | Tone |
|---|---|---|
| `recommended` | Recommended | success |
| `recommendedSearch` | Recommended for search | success |
| `ariaCustom` | ARIA custom | volt |
| `advanced` | Advanced pattern | pulse |
| `legacy` | Legacy | neutral |
| `antiPattern` | Anti-pattern | warning |
| `challenge` | Challenge | volt |
| `evil` | Evil | danger |

**Exactly one `recommended` per widget row** — the correct modern implementation. Everything else
takes a neutral/warning/accent verdict. This is asserted, not just documented:
`__tests__/FormsPage.test.tsx` expects `getAllByText('Recommended')` to have length 4 (four widget
rows), `PickersPage.test.tsx` expects 2, `ModalsPage.test.tsx` expects 2, `TablesPage.test.tsx`
expects 1. Add a row without a Recommended variant — or with two — and the suite goes red. Update
the count in the same change.

## Accessibility is deliberately asymmetric

The Recommended variant must be **fully accessible**: real label association, correct role, keyboard
support. The legacy and anti-pattern variants **violate accessibility on purpose** — that is the
exercise, and the whole reason someone practises here.

This is why `e2e/tests/accessibility.spec.ts` scans the playground **hub** and no category page. Its
header comment spells out the carve-out. Do not add a playground category page to that `PAGES` list
to "fix" a violation you shipped intentionally.

## Lint suppressions

`frontend/.oxlintrc.json` (note: under `frontend/`, not the repo root) sets `correctness: error` and
disables exactly two rules globally — `react/react-in-jsx-scope` and `jsx-a11y/prefer-tag-over-role`.
Everything else is line-scoped with a mandatory `--` justification, and every existing justification
falls into one of two families. Copy the wording; the rule names are written **bare, without the
`jsx-a11y/` prefix**, and are comma-separated when more than one fires.

Family 1 — the anti-pattern exhibit (`widgets/forms/CheckboxVariants.tsx:38`, also `ToggleVariants.tsx`,
`navigation/Accordions.tsx`, `DropdownsPage.tsx`):

```tsx
{/* oxlint-disable-next-line click-events-have-key-events, no-static-element-interactions -- deliberate anti-pattern exhibit: a div faking a checkbox with no semantics or keyboard support */}
```

Family 2 — the canonical ARIA pattern the linter cannot recognise (`widgets/dropdowns/AriaListbox.tsx:64`,
also `AsyncCombobox.tsx`, `interactions/KeyboardAndPresses.tsx`):

```tsx
// oxlint-disable-next-line no-noninteractive-element-to-interactive-role -- canonical WAI-ARIA listbox markup: ul[role=listbox] with li[role=option]
```

The iframe case is its own justified instance (`FramesPage.tsx:25` and `:45`,
`pages/frames/OuterFramePage.tsx:14`):

```tsx
{/* oxlint-disable-next-line iframe-missing-sandbox -- the embedded page is our own same-origin SPA route; it needs scripts, storage and forms, which sandbox cannot grant together */}
```

Use `{/* ... */}` in JSX child position and `//` inside a props/expression position.
**Never widen `frontend/.oxlintrc.json` to make a widget pass.** If a suppression does not fit one of
the families above, the widget is probably wrong rather than the linter.

## Where the test goes

Page-level Vitest tests live in `frontend/src/pages/playground/__tests__/`. jsdom **cannot** cover:

| Not testable in jsdom | Goes to |
|---|---|
| iframes, nested iframes | `e2e/tests/playground-structural.spec.ts` |
| shadow roots beyond the host attribute | `playground-structural.spec.ts` |
| `window.open`, new tabs, native `alert`/`confirm`/`prompt` | `playground-structural.spec.ts` |
| real downloads and file inputs | `playground-structural.spec.ts` |
| HTML5 drag & drop, sliders, canvas, long presses | `e2e/tests/playground-interaction.spec.ts` |
| `IntersectionObserver` infinite scroll | `playground-interaction.spec.ts` |

In jsdom you can still assert the *readouts* the page renders — `__tests__/WindowsPage.test.tsx` says
exactly that in its header comment. Assert the structure there, the behaviour in Playwright.

HTML5 drag & drop only works through `locator.dragTo()`, and the target must be scrolled into view
first — `playground-interaction.spec.ts` wraps this in `html5DragTo()`. Reuse it.

Shadow DOM widgets are vanilla custom elements in `frontend/src/playground/shadow/shadow-widgets.ts`
(NOT React inside shadow roots, ADR-05). Every widget mirrors its outcome to a light-DOM attribute on
the host — `data-value`, `data-count`, `data-unlocked` — so tools that cannot pierce a boundary still
have something to assert. A new shadow widget must do the same.

One test is skipped forever and that is correct:
`test.skip('a CLOSED shadow root cannot be entered — by design')` in `playground-structural.spec.ts`.
It is documentation. Do not "fix" it.

## Adding a new category

1. Add a `PlaygroundCategory` to `PLAYGROUND_CATEGORIES` in `frontend/src/playground/registry.ts`:
   `slug`, `title`, `emoji`, `description`, `path`, and — for challenge categories — a `cheatSheet`
   array of `{ tool, api }` pairs. That renders as the expandable "Automation cheat-sheet" on the hub
   card in `PlaygroundHubPage.tsx`. Follow the existing tone:
   `{ tool: 'Playwright', api: "page.frameLocator('iframe[title=…]')" }` /
   `{ tool: 'Selenium', api: 'driver.switchTo().frame(…) / defaultContent()' }`.
2. Add a `lazy()` import **and** a `<Route path="playground/<slug>">` in `frontend/src/App.tsx`,
   inside the `AppLayout` route. Every route in this app is code-split.
3. Write the page under `frontend/src/pages/playground/`, following the anatomy above.
4. Write `__tests__/<Name>Page.test.tsx` first, watch it fail, then implement (ATDD is mandatory).

## Red flags — STOP

- You typed a literal `data-testid=` on a widget element on a category page. Unless it is a
  challenge readout, the difficulty selector, or a `/frames/*` page, it belongs behind `attrs(...)`.
- You added a widget row with zero or two `recommended` verdicts, or you added a row and did not
  update the badge count in the page test.
- You edited `frontend/.oxlintrc.json`. Line-scope it with a justification instead.
- You wrote a suppression whose `--` text does not read like one of the two families above.
- Your Recommended variant is missing a label, a role or keyboard handling.
- You hard-coded `/frames/inner-form` in an iframe `src` or a `window.open` target. It must be
  `import.meta.env.BASE_URL.replace(/\/$/, '') + '/frames/inner-form'` — see `FramesPage.tsx` and
  `WindowsPage.tsx`'s `resultUrl()`. A hard-coded path works in dev and 404s only on GitHub Pages.
- You added a playground category page to `PAGES` in `e2e/tests/accessibility.spec.ts`.
- You are about to `sleep()` in an e2e spec for a dynamic challenge. Auto-waiting assertions only.

## Verify

```sh
npx vitest run                 # in frontend/
npx oxlint                     # in frontend/
npm run build                  # typecheck + build, from the repo root
npm run e2e                    # only if you touched a structural/interaction challenge
```

Then load `/playground/<slug>` and step through all three difficulty levels. At evil, reload the
page twice: if the same `id` survives a remount, the seed is not per-mount.

Use the **`verifying-changes`** skill before claiming any of this is done — it covers how to triage
the output of each command above.
