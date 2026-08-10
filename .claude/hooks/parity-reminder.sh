#!/usr/bin/env bash
# PostToolUse guardrail for the dual-implementation architecture.
#
# Every API behaviour in this repo exists twice: once in FastAPI (backend/app/) and once in a
# TypeScript engine behind Mock Service Worker (frontend/src/engine/). Changing one side alone
# ships a broken GitHub Pages build, and nothing in the type system catches it.
#
# When an edit lands on either half of a twin, this hook injects the other half's path back into
# the conversation. It never blocks; it only reminds.
#
# Input: the PostToolUse payload on stdin. Output: hookSpecificOutput.additionalContext, or nothing.

set -euo pipefail

payload="$(cat)"
path="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // .tool_response.filePath // empty')"

[ -n "$path" ] || exit 0

# Tests are written per side on purpose; a test edit is not a parity signal.
case "$path" in
  */__tests__/* | */tests/*) exit 0 ;;
esac

twin=""
direction=""

case "$path" in
  # ---- TypeScript engine -> Python -------------------------------------------------
  */frontend/src/engine/catalog.ts)  twin="backend/app/routers/products.py" ;;
  */frontend/src/engine/coupons.ts)  twin="backend/app/routers/cart.py (the coupon validate endpoint lives there)" ;;
  */frontend/src/engine/commerce.ts) twin="backend/app/services/commerce.py (money math must match line for line)" ;;
  */frontend/src/engine/store.ts)    twin="backend/app/store/memory.py" ;;
  */frontend/src/engine/token.ts)    twin="backend/app/core/security.py" ;;
  */frontend/src/engine/errors.ts)   twin="backend/app/core/errors.py" ;;
  */frontend/src/engine/*.ts)
    twin="backend/app/routers/$(basename "$path" .ts).py" ;;

  # ---- Python -> TypeScript engine -------------------------------------------------
  */backend/app/routers/products.py)   twin="frontend/src/engine/catalog.ts" ;;
  */backend/app/routers/cart.py)       twin="frontend/src/engine/cart.ts and frontend/src/engine/coupons.ts" ;;
  */backend/app/services/commerce.py)  twin="frontend/src/engine/commerce.ts (money math must match line for line)" ;;
  */backend/app/store/memory.py)       twin="frontend/src/engine/store.ts" ;;
  */backend/app/core/security.py)      twin="frontend/src/engine/token.ts" ;;
  */backend/app/core/errors.py)        twin="frontend/src/engine/errors.ts" ;;
  */backend/app/routers/*.py)
    twin="frontend/src/engine/$(basename "$path" .py).ts" ;;

  *) exit 0 ;;
esac

case "$path" in
  */frontend/*) direction="the browser-mode engine" ;;
  *)            direction="the FastAPI backend" ;;
esac

jq -n --arg twin "$twin" --arg direction "$direction" '
{
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: (
      "PARITY CHECK: you just edited " + $direction + ". This repo implements every API behaviour twice, " +
      "and the other half does not change itself.\n\n" +
      "Twin to update: " + $twin + "\n\n" +
      "If this edit changed observable API behaviour (a route, a payload shape, a status code, an error " +
      "code, validation rules or money math), it is not done until you have also updated:\n" +
      "  - docs/02-specs/api-contract.md — the normative contract both sides are written against\n" +
      "  - the twin above, plus its tests on that side\n" +
      "  - frontend/src/mocks/handlers.ts — thin adapter, wildcard path (*/api/...)\n" +
      "  - frontend/src/api/types.ts and frontend/src/api/client.ts\n" +
      "  - e2e/tests/ if the change is user-visible\n\n" +
      "Then run BOTH Playwright projects: a spec that passes in one mode and fails in the other is a " +
      "parity defect in the app, not a flaky test.\n" +
      "Full workflow: the adding-an-api-endpoint skill. If this edit was cosmetic (a comment, a rename " +
      "with no behaviour change), ignore this."
    )
  }
}'
