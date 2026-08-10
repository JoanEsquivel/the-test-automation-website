import { useCallback, useState } from 'react'

import { useDifficultyStore } from '@/playground/difficulty'

export interface LocatorOpts {
  id?: string
  name?: string
  className?: string
}

export interface LocatorAttrs {
  'data-testid'?: string
  id?: string
  name?: string
  className?: string
}

/** Deterministic djb2 hash → short base36 token (looks like a build artifact). */
function hashToken(input: string): string {
  let h = 5381
  for (let i = 0; i < input.length; i += 1) {
    h = ((h << 5) + h + input.charCodeAt(i)) >>> 0
  }
  return h.toString(36)
}

function randomSeed(): string {
  return Math.random().toString(36).slice(2, 8)
}

/**
 * Returns an `attrs(testId, opts)` function producing the locator attributes for
 * the CURRENT difficulty level:
 *
 * - easy:   data-testid + id + name + semantic className
 * - medium: no test ids / ids — stable semantic className + name only
 * - evil:   per-mount random id (`x-…`) and obfuscated class (`css-…`), nothing else
 *
 * The evil seed is created once per mount (useState initializer), so every remount
 * of the component produces different ids — exactly like a hashed-classname build.
 */
export function useLocatorAttrs() {
  const level = useDifficultyStore((state) => state.level)
  const [seed] = useState(randomSeed)

  return useCallback(
    (testId: string, opts?: LocatorOpts): LocatorAttrs => {
      let raw: LocatorAttrs
      if (level === 'easy') {
        raw = {
          'data-testid': testId,
          id: opts?.id,
          name: opts?.name,
          className: opts?.className,
        }
      } else if (level === 'medium') {
        raw = { name: opts?.name, className: opts?.className }
      } else {
        raw = {
          id: `x-${hashToken(`${seed}:${testId}`)}`,
          className: `css-${hashToken(`${testId}:${seed}`)}`,
        }
      }
      const attrs: LocatorAttrs = {}
      for (const [key, value] of Object.entries(raw)) {
        if (value !== undefined) {
          attrs[key as keyof LocatorAttrs] = value
        }
      }
      return attrs
    },
    [level, seed],
  )
}

/** Merge locator attrs with always-on styling classes (locator class wins last). */
export function withClass(attrs: LocatorAttrs, styling: string): LocatorAttrs {
  return {
    ...attrs,
    className: attrs.className ? `${styling} ${attrs.className}` : styling,
  }
}
