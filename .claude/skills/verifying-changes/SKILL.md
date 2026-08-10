---
name: verifying-changes
description: Use when about to claim work is done, fixed, working or passing, before committing or opening a PR, or after editing anything under frontend/, backend/, e2e/ or shared/seed/ — and when triaging output from npx vitest run, npx oxlint, npm run build, uv run pytest or npm run e2e, including a pytest ModuleNotFoundError for app, uv command not found, findBy* timeouts, a download that saved index.html, or a spec green in browser-mode and red in backend-mode.
---

# Verifying changes

This repo ships two API implementations and two Playwright projects. A change can typecheck, lint
clean and still be broken in the half you did not run. Verification here means **running the gates and
quoting their real output** — not recalling what they printed last time.

**Evidence before assertions. Always.** If you have not seen the output in this session, you do not
know the state of the tree.

## The five gates

Run them in this order — cheapest and most informative first.

| # | Command | Working dir | Catches |
|---|---|---|---|
| 1 | `npx vitest run` | `frontend/` | engine parity units + component/page behaviour (38 files, 218 tests) |
| 2 | `npx oxlint` | `frontend/` | `correctness` errors + `jsx-a11y` |
| 3 | `npm run build` | repo root | `tsc -b` type errors + the Vite bundle |
| 4 | `uv run pytest` | `backend/` | the FastAPI contract suite (94 tests) |
| 5 | `npm run e2e` | repo root | both Playwright projects, 31 specs each, 1 skipped per project |

Equivalents that also exist, if you prefer the root: `npm run test -w frontend` (gate 1),
`npm run test:backend` (gate 4). `npm run test:watch -w frontend` is the watcher — never a gate.

**Gate 2 detail.** `npx oxlint` exits 0 with warnings. One warning is pre-existing and expected:

```
src/engine/auth.ts:111:23: warning oxc(no-map-spread): Spreading to modify object properties in `map` calls is inefficient
```

A second warning, or any error, is yours.

**Gate 5 detail.** `npm run e2e` runs both projects. To split them:

| Command | Runs | Servers started |
|---|---|---|
| `npm run test:browser -w e2e` | `browser-mode` only | `vite preview` on :4173 serving the built Pages artifact — **no Python at all** |
| `npm run test:backend -w e2e` | `backend-mode` only | Vite dev on :5173 + FastAPI on :8000 |

The `webServer` list in `e2e/playwright.config.ts` is derived from the `--project` filter (ADR-10), so
a single-project run does not pay for the other stack. That is a speed convenience, not a substitute:
**if you touched anything on the API path, one project proves nothing.** Parity defects are, by
definition, only visible when both run.

## Which gates does this change need?

| You touched | Minimum gates |
|---|---|
| `frontend/src/engine/**` or `frontend/src/mocks/handlers.ts` | 1, 2, 3, 4, 5 (both projects) |
| `backend/app/**` | 4, then 1 and 5 — the engine twin must still agree |
| `shared/seed/*.json` | all five: both stacks read it and e2e fixtures name records by id |
| `frontend/src/pages/**`, `components/**` | 1, 2, 3, and 5 if user-visible |
| `e2e/**` | 5 |
| docs only | none — but say so explicitly |

## Failure triage

| Symptom | Cause and fix |
|---|---|
| A spec passes in one Playwright project and fails in the other | **A parity defect in the application, never a flaky test.** Fix the engine or the router so both agree with `docs/02-specs/api-contract.md`. Do not weaken the assertion, do not add a retry, do not mark it flaky. |
| A page-level Vitest test times out on `findBy*` | The engine injects simulated latency (ADR-15). Page tests need `await screen.findByTestId(id, {}, { timeout: 4000 })`. Do not remove the latency — async UI behaviour is the point of the app. |
| `npx oxlint` errors on a playground widget | If the widget is a deliberate anti-pattern exhibit, add a line-scoped `// oxlint-disable-next-line <rule> -- <justification>`. Never weaken `frontend/.oxlintrc.json`. |
| A download test saves `index.html` | The link bypassed the fetch + blob path (ADR-07). MSW ignores `mode === 'navigate'` requests, which is exactly what a bare `<a download>` produces. |
| An e2e spec 404s **only** in `browser-mode` | Either a URL-shaped string is missing `import.meta.env.BASE_URL`, or an MSW handler in `frontend/src/mocks/handlers.ts` is missing the `*/api/` wildcard. |
| `ModuleNotFoundError: app` from pytest | You ran from the repo root. `backend/pyproject.toml` sets `pythonpath = ["."]` relative to `backend/`. Run `uv run pytest` from `backend/`, or `npm run test:backend` from the root. |
| `uv: command not found` | `uv` lives at `~/.local/bin/uv` and the npm scripts call it bare. Copy the resolution from `e2e/playwright.config.ts`: `sh -c 'UV="$(command -v uv \|\| echo "$HOME/.local/bin/uv")"; exec "$UV" run ...'` |
| Backend-mode e2e sees a dirty cart | Backend-mode state is process-wide across the run. `e2e/support/actions.ts` empties the cart through the UI; `fullyParallel` is off for this reason. Do not turn it on. |
| The Playwright test `a CLOSED shadow root cannot be entered — by design` shows as skipped | Correct. It is `test.skip`ped permanently in `e2e/tests/playground-structural.spec.ts` as documentation. Do not "fix" it. |

## Accessibility gate

`e2e/tests/accessibility.spec.ts` runs axe over an explicit `PAGES` list and requires **zero `serious`
or `critical` violations**. A new user-facing page must be added to that list. Playground category
pages are excluded on purpose — their anti-pattern widgets *are* the product.

## Red flags — STOP

- About to write "all tests pass" without a gate having run in this session.
- Ran `npm run test:browser -w e2e` only, after an API change.
- Considering `test.skip`, `test.fixme` or a retry to make a cross-project failure go away.
- Editing `frontend/.oxlintrc.json` to silence a new warning.
- Removing or shortening engine latency to make a page test pass.
- Loosening an assertion so browser-mode and backend-mode "agree".
- Reporting a partial run without naming which gates you skipped and why.

## Rationalisations

| Excuse | Reality |
|---|---|
| "It's a one-line change." | One line in `frontend/src/engine/commerce.ts` is a cent of drift in every order total, in one mode only. |
| "The tests passed before my change." | Then say which command you ran and paste the tail. Memory is not evidence. |
| "E2E is slow, I'll let CI find it." | Gate 5 is the only thing that exercises the built Pages artifact. CI finding it costs a round trip and a red main. |
| "It only fails in browser-mode, that's the mock's problem." | Browser mode is what every visitor to the deployed site gets. It is the product, not a test double. |
| "Backend mode is the real one, browser mode can lag." | ADR-01 makes them peers. Divergence is a bug in whichever side disagrees with `docs/02-specs/api-contract.md`. |
| "I'll add the a11y page to `PAGES` later." | Later is after the page ships inaccessible. It is one line. |

## Reporting

State, per gate: the command, the working directory, and the actual result line — for example
`Test Files 38 passed (38) / Tests 218 passed (218)` or `94 passed`. Name any gate you did not run and
why. Only then claim the change is complete.
