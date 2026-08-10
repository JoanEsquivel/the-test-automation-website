/** Dual-mode resolution — normative rules in docs/02-specs/dual-mode-architecture.md. */

export type ApiMode = 'backend' | 'browser'

export const MODE_KEY = 'taw:apiMode'
export const BACKEND_ORIGIN = 'http://localhost:8000'
const HEALTH_TIMEOUT_MS = 1500

export interface ModeResolution {
  mode: ApiMode
  /** true on the GitHub Pages build: the toggle is disabled. */
  forced: boolean
  /** true when a stored 'backend' preference could not be honored (backend down). */
  fallback: boolean
}

export function apiBase(mode: ApiMode): string {
  if (mode === 'backend') return `${BACKEND_ORIGIN}/api`
  return `${import.meta.env.BASE_URL}api`
}

export async function checkBackendHealth(): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS)
  try {
    const response = await fetch(`${BACKEND_ORIGIN}/api/health`, { signal: controller.signal })
    return response.ok
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

interface ResolveDeps {
  forceBrowser?: boolean
  healthCheck?: () => Promise<boolean>
}

export async function resolveMode(deps: ResolveDeps = {}): Promise<ModeResolution> {
  const forceBrowser = deps.forceBrowser ?? import.meta.env.VITE_FORCE_BROWSER_MODE === 'true'
  const healthCheck = deps.healthCheck ?? checkBackendHealth

  if (forceBrowser) {
    return { mode: 'browser', forced: true, fallback: false }
  }

  const stored = localStorage.getItem(MODE_KEY) as ApiMode | null
  if (stored === 'browser') {
    return { mode: 'browser', forced: false, fallback: false }
  }
  if (stored === 'backend') {
    const healthy = await healthCheck()
    return healthy
      ? { mode: 'backend', forced: false, fallback: false }
      : { mode: 'browser', forced: false, fallback: true }
  }

  // First visit: probe silently.
  const healthy = await healthCheck()
  return { mode: healthy ? 'backend' : 'browser', forced: false, fallback: false }
}

/** Persist the user's choice and reload so the bootstrap re-runs cleanly. */
export function switchMode(mode: ApiMode): void {
  localStorage.setItem(MODE_KEY, mode)
  window.location.reload()
}
