import { Button } from '@/components/ui/Button'

interface QtyStepperProps {
  value: number
  /** Upper bound (already clamped to stock by the caller). */
  max: number
  min?: number
  disabled?: boolean
  onChange: (qty: number) => void
  /** Suffix for the data-testids, e.g. `qty-input-<productId>`. */
  idSuffix?: string
  label?: string
}

/** Number stepper shared by the product page and the cart lines.
 * Values are always clamped into [min, max] — the same rule the API enforces. */
export function QtyStepper({
  value,
  max,
  min = 1,
  disabled = false,
  onChange,
  idSuffix = '',
  label = 'Quantity',
}: QtyStepperProps) {
  const suffix = idSuffix ? `-${idSuffix}` : ''
  const inputId = `qty-input${suffix}`
  const upper = Math.max(max, min)

  function clamp(next: number): number {
    if (Number.isNaN(next)) return min
    return Math.min(Math.max(next, min), upper)
  }

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-mist-200">
        {label}
      </label>
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          data-testid={`qty-decrement${suffix}`}
          aria-label="Decrease quantity"
          disabled={disabled || value <= min}
          onClick={() => onChange(clamp(value - 1))}
        >
          −
        </Button>
        <input
          id={inputId}
          data-testid={inputId}
          type="number"
          min={min}
          max={upper}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(clamp(Number.parseInt(event.target.value, 10)))}
          className="w-20 rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-center text-sm text-mist-50 focus:border-volt-400 focus:outline-none"
        />
        <Button
          variant="secondary"
          data-testid={`qty-increment${suffix}`}
          aria-label="Increase quantity"
          disabled={disabled || value >= upper}
          onClick={() => onChange(clamp(value + 1))}
        >
          +
        </Button>
      </div>
    </div>
  )
}
