interface TextFieldProps {
  /** Doubles as the DOM id and the `data-testid` (`<id>` / `<id>-error`). */
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'password'
  autoComplete?: string
  placeholder?: string
  hint?: string
  error?: string
}

/** Labelled input with inline, accessible validation feedback. */
export function TextField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  placeholder,
  hint,
  error,
}: TextFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-mist-200">
        {label}
      </label>
      <input
        id={id}
        data-testid={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-lg border bg-ink-800 px-3 py-2 text-sm text-mist-50 placeholder:text-mist-500 focus:outline-none ${
          error ? 'border-red-500/70 focus:border-red-400' : 'border-ink-600 focus:border-volt-400'
        }`}
      />
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-mist-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} data-testid={`${id}-error`} className="mt-1 text-xs font-medium text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}
