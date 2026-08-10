import { useLocatorAttrs, withClass } from '@/playground/locators'
import { Readout, VariantCard, WidgetSection } from '@/pages/playground/widgets/WidgetChrome'

interface ToggleVariantsProps {
  alerts: boolean
  dark: boolean
  slide: boolean
  onAlerts: (value: boolean) => void
  onDark: (value: boolean) => void
  onSlide: (value: boolean) => void
}

function Knob({ on, accent }: { on: boolean; accent: string }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-5 w-9 shrink-0 items-center rounded-full border px-0.5 transition-colors ${
        on ? `${accent} justify-end` : 'border-ink-600 bg-ink-800 justify-start'
      }`}
    >
      <span className="size-3.5 rounded-full bg-mist-50" />
    </span>
  )
}

export function ToggleVariants({ alerts, dark, slide, onAlerts, onDark, onSlide }: ToggleVariantsProps) {
  const attrs = useLocatorAttrs()

  return (
    <WidgetSection
      title="Toggle / switch"
      description='A switch is a checkbox that flips immediately. role="switch" tells assistive tech (and your test framework) exactly what it is.'
    >
      <VariantCard name='<button role="switch">' verdict="recommended">
        <button
          type="button"
          role="switch"
          aria-checked={alerts}
          onClick={() => onAlerts(!alerts)}
          {...withClass(
            attrs('forms-switch-aria', { className: 'switch-aria' }),
            'flex items-center gap-3 text-left text-sm',
          )}
        >
          <Knob on={alerts} accent="border-volt-400 bg-volt-500" />
          Email alerts
        </button>
        <Readout testId="forms-switch-aria-readout" label="Alerts" value={alerts ? 'on' : 'off'} />
      </VariantCard>

      <VariantCard name="Checkbox + CSS hack" verdict="legacy">
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={dark}
            onChange={(event) => onDark(event.target.checked)}
            {...withClass(
              attrs('forms-switch-hack', { name: 'darkMode', className: 'switch-hack' }),
              'peer sr-only',
            )}
          />
          <Knob on={dark} accent="border-pulse-400 bg-pulse-500" />
          Dark mode
        </label>
        <p className="text-xs text-mist-500">
          Semantically still a checkbox (announced as one), visually a switch. Common and workable,
          but the hidden input trips naive visibility checks.
        </p>
        <Readout testId="forms-switch-hack-readout" label="Dark mode" value={dark ? 'on' : 'off'} />
      </VariantCard>

      <VariantCard name="jQuery-era sliding <div>" verdict="antiPattern">
        {/* oxlint-disable-next-line click-events-have-key-events, no-static-element-interactions -- deliberate anti-pattern exhibit: a clickable div with zero switch semantics */}
        <div
          onClick={() => onSlide(!slide)}
          {...withClass(
            attrs('forms-switch-slide', { className: 'switch-slide' }),
            'flex cursor-pointer select-none items-center gap-3 text-sm',
          )}
        >
          <Knob on={slide} accent="border-amber-400 bg-amber-500" />
          Legacy feature flag
        </div>
        <Readout testId="forms-switch-slide-readout" label="Flag" value={slide ? 'on' : 'off'} />
      </VariantCard>
    </WidgetSection>
  )
}
