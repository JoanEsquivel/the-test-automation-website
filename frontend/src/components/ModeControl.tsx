import { switchMode } from '@/api/mode'
import { useModeStore } from '@/stores/mode'

/** Header widget: mode pill + toggle. Disabled (with explanation) on the Pages build. */
export function ModeControl() {
  const { mode, forced } = useModeStore()
  const isBackend = mode === 'backend'

  return (
    <div className="flex items-center gap-2">
      <span
        data-testid="api-mode-indicator"
        className={`rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-wide ${
          isBackend
            ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
            : 'border-pulse-500/40 bg-pulse-500/15 text-pulse-300'
        }`}
      >
        {isBackend ? 'BACKEND :8000' : 'IN-BROWSER'}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={isBackend}
        aria-label="Use local backend API"
        data-testid="api-mode-toggle"
        disabled={forced}
        title={
          forced
            ? 'This deployment runs fully in your browser. Clone the repo and run the FastAPI backend locally to enable backend mode.'
            : isBackend
              ? 'Switch to in-browser mode (API served by a service worker)'
              : 'Switch to backend mode (requires the local FastAPI server on :8000)'
        }
        onClick={() => switchMode(isBackend ? 'browser' : 'backend')}
        className={`relative h-6 w-11 rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
          isBackend ? 'border-emerald-500/60 bg-emerald-500/30' : 'border-ink-600 bg-ink-700'
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-0.5 size-4.5 rounded-full bg-mist-50 transition-all ${
            isBackend ? 'left-[calc(100%-1.25rem)]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}
