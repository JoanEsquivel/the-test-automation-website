import { useState, type FormEvent } from 'react'

/**
 * Bare page embedded by the iframe challenges (/playground/frames).
 * Deliberately easy test ids: the challenge is SWITCHING INTO the frame,
 * not locating elements once inside.
 */
export default function InnerFormPage() {
  const [name, setName] = useState('')
  const [color, setColor] = useState('volt cyan')
  const [result, setResult] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    setResult(`Hello ${name.trim() || 'stranger'}, you picked ${color}.`)
  }

  return (
    <div data-testid="frame-inner-form">
      <h1 className="font-display text-lg font-bold text-mist-50">Inner form (inside the iframe)</h1>
      <p className="mt-1 text-xs text-mist-400">
        This whole document lives inside an iframe. Submit — the result renders HERE, inside the
        frame, so your script must stay switched into it to assert.
      </p>
      <form onSubmit={submit} className="mt-4 flex max-w-sm flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-mist-400">
          Your name
          <input
            data-testid="frame-name-input"
            id="frame-name"
            name="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-lg border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm text-mist-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-mist-400">
          Favorite color
          <select
            data-testid="frame-color-select"
            id="frame-color"
            name="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="rounded-lg border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm text-mist-100"
          >
            <option>volt cyan</option>
            <option>pulse violet</option>
            <option>emerald green</option>
          </select>
        </label>
        <button
          type="submit"
          data-testid="frame-submit"
          className="self-start rounded-lg bg-volt-500 px-4 py-1.5 text-sm font-semibold text-ink-950 hover:bg-volt-400"
        >
          Submit inside frame
        </button>
      </form>
      {result ? (
        <p
          data-testid="frame-form-result"
          className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
        >
          {result}
        </p>
      ) : null}
    </div>
  )
}
