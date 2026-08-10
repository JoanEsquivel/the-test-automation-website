import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { Button } from '@/components/ui/Button'
import { useLocatorAttrs, withClass } from '@/playground/locators'
import { Readout } from '@/pages/playground/widgets/WidgetChrome'

interface PortalOverlayProps {
  onClose: (result: string) => void
}

function PortalOverlay({ onClose }: PortalOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Focus trap via a native listener: Tab cycles inside the dialog, Escape dismisses.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose('dismissed')
        return
      }
      if (event.key !== 'Tab') return
      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])',
        ),
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/80 p-4">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Portal feedback modal"
        className="w-full max-w-sm rounded-xl border border-ink-600 bg-ink-900 p-6 shadow-2xl"
      >
        <h3 className="font-display text-lg font-bold text-mist-50">Portal feedback</h3>
        <p className="mt-1 text-xs text-mist-400">
          Rendered via createPortal at document.body with a manual focus trap — Tab cycles inside,
          Escape dismisses.
        </p>
        <label className="mt-3 flex flex-col gap-1 text-xs font-medium text-mist-400">
          Your feedback
          <input
            ref={inputRef}
            type="text"
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            className="rounded-lg border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm text-mist-100"
          />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onClose('cancelled')}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => onClose(`confirmed: ${feedback || 'no message'}`)}>
            Confirm
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** React portal overlay with a hand-rolled focus trap (what most design systems ship). */
export function PortalModalCard() {
  const attrs = useLocatorAttrs()
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)

  const close = (value: string) => {
    setResult(value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen(true)}
        {...withClass(
          attrs('modals-portal-trigger', { className: 'portal-modal-trigger' }),
          'inline-flex items-center justify-center rounded-lg border border-ink-600 bg-ink-700 px-4 py-2 text-sm font-medium text-mist-100 transition-colors hover:bg-ink-600',
        )}
      >
        Open portal modal
      </button>
      {open && <PortalOverlay onClose={close} />}
      <Readout testId="modals-portal-readout" label="Result" value={result || 'none'} />
    </>
  )
}
