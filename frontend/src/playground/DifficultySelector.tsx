import { Badge } from '@/components/ui/Badge'
import { DIFFICULTY_LEVELS, useDifficultyStore, type DifficultyLevel } from '@/playground/difficulty'

const LEVEL_META: Record<DifficultyLevel, { label: string; hint: string; active: string }> = {
  easy: {
    label: 'Easy',
    hint: 'data-testid, ids and names on every widget',
    active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
  },
  medium: {
    label: 'Medium',
    hint: 'no test ids — semantic classes, labels and roles only',
    active: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
  },
  evil: {
    label: 'Evil',
    hint: 'random ids and hashed classes on every mount',
    active: 'bg-red-500/20 text-red-300 border-red-500/50',
  },
}

/**
 * Global locator-difficulty switch. Deliberately ALWAYS easy to locate
 * (data-testid="difficulty-selector") — it is the control panel, not the challenge.
 */
export function DifficultySelector() {
  const level = useDifficultyStore((state) => state.level)
  const setLevel = useDifficultyStore((state) => state.setLevel)

  return (
    <section
      data-testid="difficulty-selector"
      aria-label="Locator difficulty"
      className="mb-8 rounded-2xl border border-ink-700 bg-ink-900/70 p-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-mist-400">
          Locator difficulty
        </h2>
        <Badge tone={level === 'easy' ? 'success' : level === 'medium' ? 'warning' : 'danger'}>
          {LEVEL_META[level].label}
        </Badge>
        <div role="group" aria-label="Choose locator difficulty" className="ml-auto flex rounded-lg border border-ink-600 bg-ink-800 p-1">
          {DIFFICULTY_LEVELS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={level === value}
              onClick={() => setLevel(value)}
              className={`rounded-md border px-3 py-1 text-sm font-semibold transition-colors ${
                level === value
                  ? LEVEL_META[value].active
                  : 'border-transparent text-mist-400 hover:text-mist-100'
              }`}
            >
              {LEVEL_META[value].label}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-mist-400">
        <strong className="text-mist-300">Easy</strong>: {LEVEL_META.easy.hint} ·{' '}
        <strong className="text-mist-300">Medium</strong>: {LEVEL_META.medium.hint} ·{' '}
        <strong className="text-mist-300">Evil</strong>: {LEVEL_META.evil.hint}. The selector itself
        keeps its test id at every level.
      </p>
    </section>
  )
}
