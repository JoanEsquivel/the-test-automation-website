import { useState } from 'react'

import { useLocatorAttrs, withClass } from '@/playground/locators'
import { Readout, VariantCard, WidgetSection } from '@/pages/playground/widgets/WidgetChrome'

export function maskPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (digits.length === 0) return ''
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

interface TextInputValues {
  email: string
  password: string
  quantity: string
  phone: string
  nickname: string
  bio: string
}

interface TextInputVariantsProps {
  values: TextInputValues
  onChange: <K extends keyof TextInputValues>(key: K, value: string) => void
}

const inputClass =
  'w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm text-mist-100 placeholder:text-mist-500'

export function TextInputVariants({ values, onChange }: TextInputVariantsProps) {
  const attrs = useLocatorAttrs()
  const [reveal, setReveal] = useState(false)

  return (
    <WidgetSection
      title="Text inputs"
      description="Labeled inputs are the modern baseline. Placeholder-only fields lose their hint the moment you type; contenteditable divs are not inputs at all."
    >
      <VariantCard name="Labeled inputs (email · password · number · masked)" verdict="recommended">
        <label className="flex flex-col gap-1 text-xs font-medium text-mist-400">
          Email
          <input
            type="email"
            autoComplete="off"
            value={values.email}
            onChange={(event) => onChange('email', event.target.value)}
            {...withClass(attrs('forms-input-email', { name: 'email', className: 'input-email' }), inputClass)}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-mist-400">
          Password
          <span className="flex gap-2">
            <input
              type={reveal ? 'text' : 'password'}
              autoComplete="new-password"
              value={values.password}
              onChange={(event) => onChange('password', event.target.value)}
              {...withClass(
                attrs('forms-input-password', { name: 'password', className: 'input-password' }),
                inputClass,
              )}
            />
            <button
              type="button"
              aria-label={reveal ? 'Hide password' : 'Show password'}
              aria-pressed={reveal}
              onClick={() => setReveal((v) => !v)}
              className="shrink-0 rounded-lg border border-ink-600 bg-ink-800 px-2 text-base"
            >
              {reveal ? '🙈' : '👁️'}
            </button>
          </span>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-mist-400">
          Quantity
          <input
            type="number"
            min={0}
            max={99}
            value={values.quantity}
            onChange={(event) => onChange('quantity', event.target.value)}
            {...withClass(
              attrs('forms-input-quantity', { name: 'quantity', className: 'input-quantity' }),
              inputClass,
            )}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-mist-400">
          Phone (masked as you type)
          <input
            type="tel"
            placeholder="(555) 123-4567"
            value={values.phone}
            onChange={(event) => onChange('phone', maskPhone(event.target.value))}
            {...withClass(attrs('forms-input-phone', { name: 'phone', className: 'input-phone' }), inputClass)}
          />
        </label>
      </VariantCard>

      <VariantCard name="Placeholder-only, unlabeled" verdict="antiPattern">
        {/* Deliberate anti-pattern exhibit: no label — the placeholder is the only hint and vanishes on input. */}
        <input
          type="text"
          placeholder="Your nickname"
          value={values.nickname}
          onChange={(event) => onChange('nickname', event.target.value)}
          {...withClass(attrs('forms-input-nickname', { className: 'input-nickname' }), inputClass)}
        />
        <p className="text-xs text-mist-500">
          No accessible name — getByLabelText fails here. That is the lesson.
        </p>
        <Readout testId="forms-input-nickname-readout" label="Nickname" value={values.nickname || '—'} />
      </VariantCard>

      <VariantCard name="contenteditable <div> posing as input" verdict="antiPattern">
        <div
          contentEditable
          suppressContentEditableWarning
          aria-label="Bio (contenteditable)"
          onInput={(event) => onChange('bio', event.currentTarget.textContent ?? '')}
          {...withClass(
            attrs('forms-input-bio', { className: 'input-bio' }),
            `${inputClass} min-h-16 cursor-text`,
          )}
        />
        <p className="text-xs text-mist-500">
          Not a form control: no value property, no change events, custom caret handling. fill() and
          type() behave differently here in every automation tool.
        </p>
        <Readout testId="forms-input-bio-readout" label="Bio" value={values.bio || '—'} />
      </VariantCard>
    </WidgetSection>
  )
}
