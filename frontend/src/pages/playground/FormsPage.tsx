import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { PageIntro } from '@/components/ui/PageIntro'
import { DifficultySelector } from '@/playground/DifficultySelector'
import { CheckboxVariants } from '@/pages/playground/widgets/forms/CheckboxVariants'
import { RadioVariants } from '@/pages/playground/widgets/forms/RadioVariants'
import { TextInputVariants } from '@/pages/playground/widgets/forms/TextInputVariants'
import { ToggleVariants } from '@/pages/playground/widgets/forms/ToggleVariants'

interface FormsValues {
  newsletter: boolean
  fakeCheck: boolean
  ariaCheck: boolean
  plan: string
  fakePlan: string
  ariaPlan: string
  email: string
  password: string
  quantity: string
  phone: string
  nickname: string
  bio: string
  alerts: boolean
  dark: boolean
  slide: boolean
}

const INITIAL: FormsValues = {
  newsletter: false,
  fakeCheck: false,
  ariaCheck: false,
  plan: '',
  fakePlan: '',
  ariaPlan: '',
  email: '',
  password: '',
  quantity: '1',
  phone: '',
  nickname: '',
  bio: '',
  alerts: false,
  dark: false,
  slide: false,
}

function summaryRows(v: FormsValues): [string, string][] {
  return [
    ['Newsletter (native checkbox)', v.newsletter ? 'subscribed' : 'off'],
    ['Offers (fake checkbox)', v.fakeCheck ? 'on' : 'off'],
    ['Terms (ARIA checkbox)', v.ariaCheck ? 'accepted' : 'off'],
    ['Plan (native radios)', v.plan || '—'],
    ['Plan (button group)', v.fakePlan || '—'],
    ['Plan (ARIA radios)', v.ariaPlan || '—'],
    ['Email', v.email || '—'],
    ['Password', v.password ? '•'.repeat(v.password.length) : '—'],
    ['Quantity', v.quantity || '—'],
    ['Phone', v.phone || '—'],
    ['Nickname', v.nickname || '—'],
    ['Bio', v.bio || '—'],
    ['Email alerts (switch)', v.alerts ? 'on' : 'off'],
    ['Dark mode (checkbox hack)', v.dark ? 'on' : 'off'],
    ['Legacy flag (sliding div)', v.slide ? 'on' : 'off'],
  ]
}

export default function FormsPage() {
  const [values, setValues] = useState<FormsValues>(INITIAL)
  const [summary, setSummary] = useState<[string, string][] | null>(null)

  const set = <K extends keyof FormsValues>(key: K, value: FormsValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  return (
    <div>
      <PageIntro
        title="Forms"
        what="Checkboxes, radio groups, text inputs and switches. Each one is built the way you should build it, and then the ways you keep finding in real apps."
        how='Click through every variant and watch its readout change. Then hit "Render summary" and assert the whole form state from one container. Raise the locator difficulty and run your script again to find out how much of it was leaning on test ids.'
      />
      <DifficultySelector />

      <CheckboxVariants
        native={values.newsletter}
        fake={values.fakeCheck}
        aria={values.ariaCheck}
        onNative={(v) => set('newsletter', v)}
        onFake={(v) => set('fakeCheck', v)}
        onAria={(v) => set('ariaCheck', v)}
      />

      <RadioVariants
        native={values.plan}
        fake={values.fakePlan}
        aria={values.ariaPlan}
        onNative={(v) => set('plan', v)}
        onFake={(v) => set('fakePlan', v)}
        onAria={(v) => set('ariaPlan', v)}
      />

      <TextInputVariants
        values={{
          email: values.email,
          password: values.password,
          quantity: values.quantity,
          phone: values.phone,
          nickname: values.nickname,
          bio: values.bio,
        }}
        onChange={(key, value) => set(key, value)}
      />

      <ToggleVariants
        alerts={values.alerts}
        dark={values.dark}
        slide={values.slide}
        onAlerts={(v) => set('alerts', v)}
        onDark={(v) => set('dark', v)}
        onSlide={(v) => set('slide', v)}
      />

      <section
        aria-label="Verify your work"
        className="rounded-2xl border border-volt-500/30 bg-ink-900 p-6"
      >
        <h2 className="font-display text-xl font-bold text-mist-50">Verify your work</h2>
        <p className="mt-1 text-sm text-mist-400">
          Snapshot every value above into one place, then assert against it.
        </p>
        <Button className="mt-4" onClick={() => setSummary(summaryRows(values))}>
          Render summary
        </Button>
        {summary && (
          <dl
            data-testid="form-summary"
            className="mt-5 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2"
          >
            {summary.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-ink-800 pb-1">
                <dt className="text-mist-400">{label}</dt>
                <dd className="font-mono text-volt-300">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </div>
  )
}
