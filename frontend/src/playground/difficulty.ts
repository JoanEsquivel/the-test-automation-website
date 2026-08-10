import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Locator difficulty for all playground widgets (see docs/02-specs/playground-catalog.md). */
export type DifficultyLevel = 'easy' | 'medium' | 'evil'

export const DIFFICULTY_LEVELS: DifficultyLevel[] = ['easy', 'medium', 'evil']

interface DifficultyState {
  level: DifficultyLevel
  setLevel: (level: DifficultyLevel) => void
}

/** Persisted globally so the chosen challenge level follows the visitor across pages. */
export const useDifficultyStore = create<DifficultyState>()(
  persist(
    (set) => ({
      level: 'easy',
      setLevel: (level) => set({ level }),
    }),
    { name: 'taw:difficulty' },
  ),
)
