/** Accessible modal primitive shared by the admin forms and confirm dialogs.
 *
 * Rendered in a portal at `document.body` with the three behaviors automation
 * suites are expected to assert: an initial focus move into the dialog, a Tab
 * focus trap, Escape-to-close, and focus restored to the trigger on unmount.
 */

import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

interface ModalProps {
  title: string
  /** Short explanation rendered under the title (also the accessible description). */
  description?: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  'data-testid'?: string
}

export function Modal({ title, description, onClose, children, footer, ...rest }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  // Move focus in on mount and hand it back to the trigger on unmount.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()
    return () => previouslyFocused?.focus()
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusables = Array.from(dialog!.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusables.length === 0) return
      const first = focusables[0]!
      const last = focusables[focusables.length - 1]!
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    dialog.addEventListener('keydown', handleKeyDown)
    return () => dialog.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink-950/80 p-4 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="w-full max-w-lg rounded-2xl border border-ink-700 bg-ink-900 p-6 shadow-2xl shadow-ink-950/70"
        {...rest}
      >
        <h2 id={titleId} className="font-display text-lg font-bold text-mist-50">
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className="mt-1 text-sm leading-relaxed text-mist-400">
            {description}
          </p>
        )}
        <div className="mt-5">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
