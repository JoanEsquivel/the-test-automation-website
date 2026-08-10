import { useLocatorAttrs, withClass } from '@/playground/locators'
import { Readout, VariantCard, WidgetSection } from '@/pages/playground/widgets/WidgetChrome'

interface CheckboxVariantsProps {
  native: boolean
  fake: boolean
  aria: boolean
  onNative: (value: boolean) => void
  onFake: (value: boolean) => void
  onAria: (value: boolean) => void
}

export function CheckboxVariants({ native, fake, aria, onNative, onFake, onAria }: CheckboxVariantsProps) {
  const attrs = useLocatorAttrs()

  return (
    <WidgetSection
      title="Checkbox"
      description="Three ways teams ship a checkbox. The native one costs nothing: label clicks, keyboard, form submission and screen-reader support all work before you write any code. The other two are you rebuilding that by hand."
    >
      <VariantCard name='<input type="checkbox"> + <label>' verdict="recommended">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={native}
            onChange={(event) => onNative(event.target.checked)}
            {...withClass(
              attrs('forms-checkbox-native', { name: 'newsletter', className: 'checkbox-native' }),
              'size-4 accent-volt-500',
            )}
          />
          Subscribe to the newsletter
        </label>
        <Readout testId="forms-checkbox-native-readout" label="Newsletter" value={native ? 'subscribed' : 'off'} />
      </VariantCard>

      <VariantCard name="<div> + click handler (fake)" verdict="antiPattern">
        {/* oxlint-disable-next-line click-events-have-key-events, no-static-element-interactions -- deliberate anti-pattern exhibit: a div faking a checkbox with no semantics or keyboard support */}
        <div
          onClick={() => onFake(!fake)}
          {...withClass(
            attrs('forms-checkbox-fake', { className: 'fake-checkbox' }),
            'flex cursor-pointer select-none items-center gap-2',
          )}
        >
          <span
            aria-hidden="true"
            className={`grid size-4 place-items-center rounded border text-[10px] font-bold ${
              fake ? 'border-volt-400 bg-volt-500 text-ink-950' : 'border-ink-600 bg-ink-800'
            }`}
          >
            {fake ? '✓' : ''}
          </span>
          Send me exclusive offers
        </div>
        <Readout testId="forms-checkbox-fake-readout" label="Fake checkbox" value={fake ? 'on' : 'off'} />
      </VariantCard>

      <VariantCard name='role="checkbox" custom' verdict="ariaCustom">
        <span
          role="checkbox"
          aria-checked={aria}
          tabIndex={0}
          onClick={() => onAria(!aria)}
          onKeyDown={(event) => {
            if (event.key === ' ' || event.key === 'Enter') {
              event.preventDefault()
              onAria(!aria)
            }
          }}
          {...withClass(
            attrs('forms-checkbox-aria', { className: 'aria-checkbox' }),
            'flex cursor-pointer select-none items-center gap-2',
          )}
        >
          <span
            aria-hidden="true"
            className={`grid size-4 place-items-center rounded border text-[10px] font-bold ${
              aria ? 'border-pulse-400 bg-pulse-500 text-ink-950' : 'border-ink-600 bg-ink-800'
            }`}
          >
            {aria ? '✓' : ''}
          </span>
          Accept the terms
        </span>
        <Readout testId="forms-checkbox-aria-readout" label="Terms" value={aria ? 'accepted' : 'off'} />
      </VariantCard>
    </WidgetSection>
  )
}
