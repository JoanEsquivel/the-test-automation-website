import { useRef, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { useLocatorAttrs, withClass } from '@/playground/locators'
import { Readout } from '@/pages/playground/widgets/WidgetChrome'

/**
 * Recommended: native <dialog showModal> — real top layer, focus containment and
 * Escape handling from the platform. jsdom does not implement showModal(), so we
 * feature-detect and fall back to the plain `open` attribute there.
 */
export function NativeDialogCard() {
  const attrs = useLocatorAttrs()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState('')
  const [result, setResult] = useState('')

  const openDialog = () => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (typeof dialog.showModal === 'function') {
      dialog.showModal()
    } else {
      // jsdom fallback: no top layer, but the dialog becomes visible/queryable
      dialog.setAttribute('open', '')
    }
  }

  const closeDialog = () => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (typeof dialog.close === 'function') {
      dialog.close()
    } else {
      dialog.removeAttribute('open')
    }
  }

  return (
    <>
      <Button
        variant="secondary"
        onClick={openDialog}
        {...attrs('modals-native-trigger', { className: 'native-dialog-trigger' })}
      >
        Open native dialog
      </Button>
      <dialog
        ref={dialogRef}
        aria-label="Native feedback dialog"
        {...withClass(
          attrs('modals-native-dialog', { className: 'native-dialog' }),
          'rounded-xl border border-ink-600 bg-ink-900 p-6 text-mist-100 backdrop:bg-ink-950/80',
        )}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault()
            setResult(`submitted: ${name || 'anonymous'}`)
            closeDialog()
          }}
          className="flex flex-col gap-3"
        >
          <h3 className="font-display text-lg font-bold">Native dialog</h3>
          <label className="flex flex-col gap-1 text-xs font-medium text-mist-400">
            Your name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-lg border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm text-mist-100"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setResult('cancelled')
                closeDialog()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Submit
            </Button>
          </div>
        </form>
      </dialog>
      <Readout testId="modals-native-readout" label="Result" value={result || 'none'} />
    </>
  )
}
