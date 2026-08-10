# The Test Automation Website — working rules

A practice app for web and API test automation. Two halves: a **components playground** where the
same widget appears in several implementations with deliberate locator traps, and a **working store**
(catalog → cart → checkout → orders → admin) meant to be automated end to end. The whole app is
served by two interchangeable API implementations, which is where every non-obvious rule below
comes from.

Live: <https://joanesquivel.github.io/the-test-automation-website/>

---

## The parity rule — read this before touching anything

**Every API behaviour is implemented twice.** Once in FastAPI (`backend/app/`), once in a TypeScript
engine behind Mock Service Worker (`frontend/src/engine/`). The UI never knows which one is answering:
`frontend/src/api/client.ts` always issues a real `fetch`.

Nothing in the type system stops you from changing one side and shipping. The failure surfaces only on
the deployed site or in the second Playwright project — which is exactly when it is most expensive.

Three rules follow:

1. **`docs/02-specs/api-contract.md` is normative.** Both implementations are written *against the
   doc*, never against each other. Change the doc first.
2. **Touch both twins in the same change.** The mapping is not a basename substitution:

   All engine paths below are under `frontend/src/`, all Python paths under `backend/`.

   | Engine module | Python twin |
   |---|---|
   | `engine/admin.ts` `engine/auth.ts` `engine/cart.ts` `engine/files.ts` `engine/orders.ts` `engine/reviews.ts` `engine/wishlist.ts` | `app/routers/<same name>.py` |
   | `engine/catalog.ts` | `app/routers/products.py` |
   | `engine/coupons.ts` | `app/routers/cart.py` — the validate endpoint lives there |
   | `engine/commerce.ts` | `app/services/commerce.py` — money math, line for line |
   | `engine/store.ts` | `app/store/memory.py` |
   | `engine/token.ts` | `app/core/security.py` |
   | `engine/errors.ts` | `app/core/errors.py` |

3. **The enforcement is executable**: `npm run e2e` runs the same specs against `browser-mode` and
   `backend-mode`. Green in one and red in the other is an app defect, never a flaky test.

For the full ordered workflow, use the **`adding-an-api-endpoint`** skill.

---

## Commands

Run from the repo root unless noted.

| Task | Command |
|---|---|
| Frontend dev server (:5173) | `npm run dev` |
| Backend dev server (:8000) | `npm run dev:backend` |
| Frontend tests | `npm run test -w frontend` (or `npx vitest run` in `frontend/`) |
| Frontend tests, watch | `npm run test:watch -w frontend` |
| Lint | `npx oxlint` in `frontend/` |
| Typecheck + build | `npm run build` |
| Backend tests | `cd backend && uv run pytest` |
| E2E, both modes | `npm run e2e` |
| E2E, one mode | `npm run test:browser -w e2e` / `npm run test:backend -w e2e` |
| The exact deployed artifact | `npm run build:pages` |

`uv` caveat: `dev:backend` and `test:backend` call bare `uv`, which breaks in a shell whose PATH lacks
`~/.local/bin`. Any *new* script that shells out to `uv` should copy the resolution used in
`e2e/playwright.config.ts`:

```sh
sh -c 'UV="$(command -v uv || echo "$HOME/.local/bin/uv")"; exec "$UV" run ...'
```

---

## Repo map

```
frontend/src/
  api/          client.ts (the only place URLs are written), mode.ts, types.ts, errorMessage.ts
  engine/       the browser-side API implementation — pure TS, no React, no MSW imports
  mocks/        handlers.ts (thin adapters only), browser.ts
  playground/   difficulty.ts, locators.ts, registry.ts, shadow/shadow-widgets.ts
  pages/        HomePage · playground/ · shop/ · account/ · admin/ · frames/
  components/   ui/ primitives, RequireAuth, RequireAdmin, ModeControl
  stores/       zustand: auth, cart, mode
  test/         setup.ts, shop.ts (msw/node harness)
backend/app/    main.py · core/ · routers/ · schemas/ · services/ · store/
backend/tests/  pytest, one file per domain
e2e/            playwright.config.ts, fixtures.ts, support/, tests/
shared/seed/    the single source of truth for demo data — read by BOTH stacks
docs/           01-exploration · 02-specs (normative) · 03-implementation (ADRs) · 04-testing
```

Tests live in `__tests__/` folders colocated with the code, plus `backend/tests/` and `e2e/tests/`.
`frontend/README.md` is untouched Vite boilerplate — ignore it. The real docs are the root `README.md`
and `docs/`.

---

## Conventions

**TypeScript.** `frontend/tsconfig.app.json` sets `erasableSyntaxOnly`, so **no enums and no
constructor parameter properties** — use `const` objects plus union types (see
`frontend/src/playground/difficulty.ts`). `verbatimModuleSyntax` makes `import type` mandatory for
type-only imports. Unused-parameter discards use the `_` prefix (`const { password: _password, ...rest }`).

**Aliases** `@/` → `frontend/src` and `@seed/` → `shared/seed` are declared in **two files that must
agree**: `frontend/tsconfig.app.json` and `frontend/vite.config.ts` (which also needs
`server.fs.allow: ['..']` to read outside the frontend root).

**Lint** (`frontend/.oxlintrc.json`): `correctness` is an error. Two rules are globally off —
`react/react-in-jsx-scope` (new JSX transform) and `jsx-a11y/prefer-tag-over-role` (the playground
ships ARIA-role markup on purpose). Every other suppression is line-scoped and **must carry a
justification** after `--`, in one of two families:

Rule names go **without** the plugin prefix, and the anti-pattern family usually names two rules. Real
examples, copy the shape and the wording:

```tsx
// oxlint-disable-next-line click-events-have-key-events, no-static-element-interactions -- deliberate anti-pattern exhibit: a div faking a checkbox with no semantics or keyboard support
// oxlint-disable-next-line no-noninteractive-element-to-interactive-role -- canonical WAI-ARIA listbox markup: ul[role=listbox] with li[role=option]
```

Position matters: in a JSX child slot the comment must be wrapped as `{/* … */}`; in a prop or
statement slot the bare `//` form works.

**Styling.** Tailwind v4 with a single `@theme` block in `frontend/src/index.css` — there is no
`tailwind.config.js`. Four colour ramps only: **ink** (backgrounds), **mist** (text, contrast-checked
against ink-900), **volt** (cyan accent), **pulse** (violet accent). Do not introduce a colour outside
them. Utilities available: `.text-gradient`, `.bg-blueprint`, `.skip-link`, `font-display`.

**Test ids — the split that is easy to get backwards** (ADR-04):

- **Playground pages** use `useLocatorAttrs()` from `frontend/src/playground/locators.ts`, because
  locators *are* the exercise. Levels: easy → `data-testid`; medium → semantic class + name only;
  evil → per-mount random `id`/`className`.
- **Shop, account and admin pages** use plain, stable, kebab-case `data-testid` on every interactive
  element and readout, because they model a real application. They never import the difficulty hook.
- Legitimate raw test ids inside the playground: the difficulty selector itself, challenge readouts
  (assertion targets, not locator puzzles) and the `/frames/*` pages.

**ATDD is not optional.** Write the acceptance test from the spec, run it and watch it fail, then
implement until green. Every feature commit in this repo followed that loop; keep the streak.

---

## Things that break silently

- **Every URL-shaped string must go through `import.meta.env.BASE_URL`** — the site is served from
  `/the-test-automation-website/`. That covers the router `basename`, the MSW worker URL, iframe
  `src` and `window.open`. Iframes use the stripped form:
  `import.meta.env.BASE_URL.replace(/\/$/, '') + '/frames/inner-form'`. A hard-coded `/frames/...`
  works in dev and 404s only on Pages.
- **MSW handlers must use the `*/api/...` wildcard.** `http.get('/api/foo')` works in dev and dies on
  the deployed base path.
- **`shared/seed/*.json` is read by both stacks** (FastAPI at startup, Vite via the `@seed` alias) and
  e2e fixtures name records by id. Editing seed data can break tests in three places at once.
- **Engine requests carry simulated latency**, so page-level Vitest tests need
  `await screen.findByTestId(id, {}, { timeout: 4000 })` (ADR-15).
- **Backend-mode state is process-wide.** E2E cannot assume a clean cart for the seeded account;
  `e2e/support/actions.ts` empties it through the UI, and `fullyParallel` is off for that reason.
- **Downloads must go through `fetch` + blob** (ADR-07). MSW ignores `mode === 'navigate'` requests,
  which is exactly what `<a download>` produces — on Pages it would save `index.html`.
- **E2E specs use relative paths**: `page.goto('shop/catalog')`. A leading slash escapes the base URL.
- **CORS** allows only `localhost:5173` and `localhost:4173`, with `expose_headers: ["Content-Disposition"]`.
  A new dev port needs `CORS_ORIGINS` in `backend/app/main.py`.
- `frontend/src/engine/store.ts` keys localStorage under `taw:engine:v1:` — bump `ENGINE_VERSION` to
  invalidate stale shapes. `taw:apiMode`, `taw:auth`, `taw:cart` and `taw:difficulty` sit outside that
  prefix on purpose and survive a data reset.

**One Playwright test is skipped forever**: `a CLOSED shadow root cannot be entered — by design`.
It is documentation, not a bug. Do not "fix" it.

---

## Known doc drift (deliberate — do not re-fix)

- `docs/01-exploration/notes.md` says React 18; the repo ships React 19. That file records what was
  decided at the time, and ADR-16 records the upgrade.
- `docs/04-testing/strategy.md` describes `npm test` as a watcher. Stale: it is `vitest run` now,
  with `test:watch` for the watcher.
- README test counts trail the source by a few tests.

---

## Where to look next

| Question | File |
|---|---|
| What should this endpoint do? | `docs/02-specs/api-contract.md` (normative) |
| What shape is this data? | `docs/02-specs/data-model.md` |
| Why is it built this way? | `docs/03-implementation/decisions.md` (ADR-01 … ADR-17) |
| How is this tested? | `docs/04-testing/strategy.md` |
| What widgets/challenges exist? | `docs/02-specs/playground-catalog.md` |
| What does the store do? | `docs/02-specs/ecommerce-spec.md` |

Skills in `.claude/skills/`: **adding-an-api-endpoint**, **adding-a-playground-challenge**,
**adding-a-store-feature**, **verifying-changes**. Use them; they carry the details this file compresses.
