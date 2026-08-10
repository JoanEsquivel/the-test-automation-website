import { useEffect, useState } from 'react'

export const HANDSHAKE_KEY = 'taw:handshake'

/**
 * Bare page opened by the windows & tabs challenges. On load it writes a
 * handshake value to localStorage (same origin as the opener), which the
 * windows page polls and displays — an observable cross-window outcome.
 */
export default function FrameResultPage() {
  const [value, setValue] = useState('')

  useEffect(() => {
    const handshake = `hello-from-result @ ${new Date().toISOString()}`
    localStorage.setItem(HANDSHAKE_KEY, handshake)
    setValue(handshake)
  }, [])

  return (
    <div data-testid="frame-result">
      <h1 className="font-display text-lg font-bold text-mist-50">Result page</h1>
      <p className="mt-1 text-xs text-mist-400">
        Opened from the Windows &amp; dialogs playground. This page wrote a handshake value to
        localStorage on load, and the opener tab polls for it and shows it in its readout.
      </p>
      <p
        data-testid="frame-result-message"
        className="mt-4 rounded-lg border border-volt-500/40 bg-volt-500/10 px-3 py-2 font-mono text-sm text-volt-300"
      >
        {value || 'writing handshake…'}
      </p>
      <p className="mt-3 text-xs text-mist-500">
        Close this tab once your script has read the value.
      </p>
    </div>
  )
}
