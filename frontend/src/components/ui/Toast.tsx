/** Lightweight app-wide toast system.
 *
 * `ToastProvider` mounts a single polite live region; `useToast()` returns a
 * `push({ tone, message })` function used by every mutation in the store.
 * Toasts auto-dismiss after ~4 s and can be dismissed manually.
 *
 * The hook is deliberately safe outside a provider (returns a no-op) so pages
 * can be rendered in isolation by unit tests without extra wrappers.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

const TONES = {
  info: 'border-volt-500/40 bg-volt-500/10 text-volt-200',
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  danger: 'border-red-500/40 bg-red-500/10 text-red-200',
} as const

const ICONS = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  danger: '⛔',
} as const

export type ToastTone = keyof typeof TONES

export interface ToastInput {
  tone?: ToastTone
  message: ReactNode
}

interface ToastRecord {
  id: number
  tone: ToastTone
  message: ReactNode
}

export const TOAST_DURATION_MS = 4000

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null)

function noop() {
  // Rendered outside a ToastProvider (isolated unit test): toasts are a no-op.
}

/** Returns `push` — safe to call whether or not a provider is mounted. */
export function useToast(): (toast: ToastInput) => void {
  return useContext(ToastContext) ?? noop
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const nextId = useRef(1)
  const timers = useRef<number[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    ({ tone = 'info', message }: ToastInput) => {
      const id = nextId.current
      nextId.current += 1
      setToasts((current) => [...current, { id, tone, message }])
      const timer = window.setTimeout(() => dismiss(id), TOAST_DURATION_MS)
      timers.current.push(timer)
    },
    [dismiss],
  )

  useEffect(() => {
    const pending = timers.current
    return () => {
      for (const timer of pending) window.clearTimeout(timer)
    }
  }, [])

  const value = useMemo(() => push, [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        data-testid="toast-region"
        // `role="status"` is an implicit polite live region AND, unlike a bare
        // div, it is allowed to carry an accessible name (axe: aria-prohibited-attr).
        role="status"
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            data-testid="toast"
            data-tone={toast.tone}
            className={`pointer-events-auto flex items-start gap-2 overflow-hidden rounded-xl border px-3 py-2.5 text-sm shadow-lg shadow-ink-950/60 backdrop-blur ${TONES[toast.tone]}`}
          >
            <span aria-hidden="true">{ICONS[toast.tone]}</span>
            <div className="flex-1 leading-relaxed">{toast.message}</div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 rounded p-0.5 text-current opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
