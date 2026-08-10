import { create } from 'zustand'

import type { ModeResolution } from '@/api/mode'

interface ModeState extends ModeResolution {
  fallbackDismissed: boolean
  initialize: (resolution: ModeResolution) => void
  dismissFallback: () => void
}

export const useModeStore = create<ModeState>((set) => ({
  mode: 'browser',
  forced: false,
  fallback: false,
  fallbackDismissed: false,
  initialize: (resolution) => set({ ...resolution, fallbackDismissed: false }),
  dismissFallback: () => set({ fallbackDismissed: true }),
}))
