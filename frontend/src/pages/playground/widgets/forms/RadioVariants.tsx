import { useRef } from 'react'

import { useLocatorAttrs, withClass } from '@/playground/locators'
import { Readout, VariantCard, WidgetSection } from '@/pages/playground/widgets/WidgetChrome'

export const PLANS = ['Starter', 'Pro', 'Enterprise'] as const

interface RadioVariantsProps {
  native: string
  fake: string
  aria: string
  onNative: (value: string) => void
  onFake: (value: string) => void
  onAria: (value: string) => void
}

export function RadioVariants({ native, fake, aria, onNative, onFake, onAria }: RadioVariantsProps) {
  const attrs = useLocatorAttrs()
  const ariaRefs = useRef<(HTMLButtonElement | null)[]>([])

  const moveAria = (from: number, delta: number) => {
    const next = (from + delta + PLANS.length) % PLANS.length
    onAria(PLANS[next])
    ariaRefs.current[next]?.focus()
  }

  return (
    <WidgetSection
      title="Radio group"
      description="Pick a plan. Native radios in a fieldset get grouping, arrow keys and form semantics for free — the fake button group has none of that."
    >
      <VariantCard name="<fieldset> + native radios" verdict="recommended">
        <fieldset className="rounded-lg border border-ink-700 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-mist-400">
            Plan
          </legend>
          <div className="flex flex-col gap-2">
            {PLANS.map((plan) => (
              <label key={plan} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  value={plan}
                  checked={native === plan}
                  onChange={() => onNative(plan)}
                  {...withClass(
                    attrs(`forms-radio-native-${plan.toLowerCase()}`, {
                      name: 'plan',
                      className: 'radio-native',
                    }),
                    'size-4 accent-volt-500',
                  )}
                />
                {plan}
              </label>
            ))}
          </div>
        </fieldset>
        <Readout testId="forms-radio-native-readout" label="Plan" value={native || 'none'} />
      </VariantCard>

      <VariantCard name="Button group posing as radios" verdict="antiPattern">
        <div className="flex gap-1 rounded-lg border border-ink-700 bg-ink-800 p-1">
          {PLANS.map((plan) => (
            <button
              key={plan}
              type="button"
              onClick={() => onFake(plan)}
              {...withClass(
                attrs(`forms-radio-fake-${plan.toLowerCase()}`, { className: 'fake-radio' }),
                `flex-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                  fake === plan ? 'bg-volt-500 text-ink-950' : 'text-mist-400 hover:text-mist-100'
                }`,
              )}
            >
              {plan}
            </button>
          ))}
        </div>
        <p className="text-xs text-mist-500">
          Looks selected, but no radio semantics: screen readers and keyboards see unrelated buttons.
        </p>
        <Readout testId="forms-radio-fake-readout" label="Plan" value={fake || 'none'} />
      </VariantCard>

      <VariantCard name='role="radiogroup" + roving tabindex' verdict="ariaCustom">
        <div role="radiogroup" aria-label="Plan (ARIA radios)" className="flex flex-col gap-2">
          {PLANS.map((plan, index) => {
            const checked = aria === plan
            return (
              <button
                key={plan}
                type="button"
                role="radio"
                aria-checked={checked}
                tabIndex={checked || (!aria && index === 0) ? 0 : -1}
                ref={(el) => {
                  ariaRefs.current[index] = el
                }}
                onClick={() => onAria(plan)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
                    event.preventDefault()
                    moveAria(index, 1)
                  } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
                    event.preventDefault()
                    moveAria(index, -1)
                  }
                }}
                {...withClass(
                  attrs(`forms-radio-aria-${plan.toLowerCase()}`, { className: 'aria-radio' }),
                  'flex items-center gap-2 rounded-lg border border-ink-700 px-3 py-1.5 text-left text-sm hover:border-ink-600',
                )}
              >
                <span
                  aria-hidden="true"
                  className={`size-3 rounded-full border-2 ${
                    checked ? 'border-pulse-400 bg-pulse-500' : 'border-ink-600'
                  }`}
                />
                {plan}
              </button>
            )
          })}
        </div>
        <Readout testId="forms-radio-aria-readout" label="Plan" value={aria || 'none'} />
      </VariantCard>
    </WidgetSection>
  )
}
