export type CheckoutStep = 'shipping' | 'payment' | 'review'

export const CHECKOUT_STEPS: { id: CheckoutStep; label: string; blurb: string }[] = [
  { id: 'shipping', label: 'Shipping', blurb: 'Where the order goes' },
  { id: 'payment', label: 'Payment', blurb: 'Simulated card details' },
  { id: 'review', label: 'Review', blurb: 'Check, then place the order' },
]

export function stepIndex(step: CheckoutStep): number {
  return CHECKOUT_STEPS.findIndex((entry) => entry.id === step)
}

interface CheckoutStepperProps {
  current: CheckoutStep
  /** Steps already completed can be revisited by clicking them. */
  onNavigate: (step: CheckoutStep) => void
}

/** Ordered header of the checkout wizard. The active step carries
 * `aria-current="step"` so assistive tech and automation agree on where we are. */
export function CheckoutStepper({ current, onNavigate }: CheckoutStepperProps) {
  const currentIndex = stepIndex(current)

  return (
    <nav aria-label="Checkout progress" data-testid="checkout-stepper">
      <ol className="grid gap-3 sm:grid-cols-3">
        {CHECKOUT_STEPS.map((step, index) => {
          const state = index === currentIndex ? 'current' : index < currentIndex ? 'complete' : 'upcoming'
          return (
            <li key={step.id}>
              <button
                type="button"
                data-testid={`stepper-${step.id}`}
                data-state={state}
                aria-current={state === 'current' ? 'step' : undefined}
                disabled={state === 'upcoming'}
                onClick={() => onNavigate(step.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors disabled:cursor-not-allowed ${
                  state === 'current'
                    ? 'border-volt-500/60 bg-volt-500/10'
                    : state === 'complete'
                      ? 'border-emerald-500/40 bg-ink-900 hover:border-emerald-400/60'
                      : 'border-ink-700 bg-ink-900 opacity-60'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                    state === 'current'
                      ? 'bg-volt-500 text-ink-950'
                      : state === 'complete'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-ink-700 text-mist-400'
                  }`}
                >
                  {state === 'complete' ? '✓' : index + 1}
                </span>
                <span>
                  <span className="font-display block text-sm font-bold text-mist-50">{step.label}</span>
                  <span className="block text-xs text-mist-400">{step.blurb}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
