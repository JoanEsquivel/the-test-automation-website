import type { ReactNode } from 'react'

import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Destructive-action confirmation used by the address book and the admin tables. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      data-testid="confirm-dialog"
      footer={
        <>
          <Button variant="secondary" data-testid="confirm-cancel" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant="danger" data-testid="confirm-accept" onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-mist-300">{message}</p>
    </Modal>
  )
}
