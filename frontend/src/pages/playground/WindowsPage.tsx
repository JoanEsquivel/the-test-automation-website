import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { PageIntro } from '@/components/ui/PageIntro'
import { DifficultySelector } from '@/playground/DifficultySelector'
import { AutomationNote, ChallengeReadout } from '@/pages/playground/widgets/ChallengeChrome'
import { VariantCard, WidgetSection } from '@/pages/playground/widgets/WidgetChrome'

const HANDSHAKE_KEY = 'taw:handshake'

function resultUrl(): string {
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/frames/result`
}

/** D.3 — new tabs, popups and the localStorage handshake. */
function NewWindowsSection() {
  const [handshake, setHandshake] = useState('')

  useEffect(() => {
    // Poll localStorage: the result page (opened in another tab/window on the
    // same origin) writes the handshake value on load.
    const read = () => setHandshake(localStorage.getItem(HANDSHAKE_KEY) ?? '')
    read()
    const interval = window.setInterval(read, 500)
    return () => window.clearInterval(interval)
  }, [])

  function clearHandshake() {
    localStorage.removeItem(HANDSHAKE_KEY)
    setHandshake('')
  }

  return (
    <WidgetSection
      title="New windows & tabs"
      description="Three ways to end up with a second page: a target=_blank link, a window.open popup, and a round-trip you can assert from THIS tab without switching."
      columns="md:grid-cols-3"
    >
      <VariantCard name='<a target="_blank">' verdict="challenge">
        <p className="text-xs text-mist-400">
          A plain link that opens the result page in a new tab. Your driver has to catch the new
          page before it can touch anything on it.
        </p>
        <a
          href={resultUrl()}
          target="_blank"
          rel="noopener"
          className="inline-flex w-fit items-center rounded-lg bg-volt-500 px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-volt-400"
        >
          Open result page in a new tab
        </a>
        <AutomationNote>
          Playwright: <code>const [page1] = await Promise.all([context.waitForEvent(&apos;page&apos;),
          link.click()])</code>. Selenium: diff <code>getWindowHandles()</code> before/after, then{' '}
          <code>switchTo().window(newHandle)</code>.
        </AutomationNote>
      </VariantCard>

      <VariantCard name="window.open() popup" verdict="challenge">
        <p className="text-xs text-mist-400">
          Opens the result page in a 420×520 popup. Handle it exactly like a tab: a popup is just
          a page with less chrome around it.
        </p>
        <Button
          size="sm"
          onClick={() => window.open(resultUrl(), 'taw-popup', 'popup,width=420,height=520')}
        >
          Open popup window
        </Button>
        <AutomationNote>
          Same as the tab case: wait for the new page or window handle. Never assume the handles
          come back in a useful ORDER. Match on URL or title.
        </AutomationNote>
      </VariantCard>

      <VariantCard name="Cross-tab handshake" verdict="challenge">
        <p className="text-xs text-mist-400">
          The result page writes a value to localStorage on load and this tab polls for it. That
          gives you an outcome to assert WITHOUT switching context.
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => window.open(resultUrl(), '_blank')}>
            Open result page (handshake)
          </Button>
          <Button size="sm" variant="ghost" onClick={clearHandshake}>
            Clear
          </Button>
        </div>
        <ChallengeReadout
          testId="windows-handshake-readout"
          label="Handshake"
          value={handshake || 'waiting for the result page…'}
        />
        <AutomationNote>
          Open the page, come back to the opener and wait for this readout to change. That proves
          the second page actually RAN, which "a new tab exists" does not.
        </AutomationNote>
      </VariantCard>
    </WidgetSection>
  )
}

/** D.4 — native alert / confirm / prompt / beforeunload. */
function NativeDialogsSection() {
  const [confirmResult, setConfirmResult] = useState('not asked yet')
  const [promptResult, setPromptResult] = useState('not asked yet')
  const [guardArmed, setGuardArmed] = useState(false)

  useEffect(() => {
    if (!guardArmed) return undefined
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      // Chrome requires returnValue to be set to show the confirmation.
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [guardArmed])

  return (
    <WidgetSection
      title="Native dialogs"
      description="alert(), confirm() and prompt() block the page until something answers them, so a driver has to accept, dismiss or fill them. There is an opt-in beforeunload guard too."
      columns="md:grid-cols-2"
    >
      <VariantCard name="alert() & confirm()" verdict="challenge">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => window.alert('This is a native alert. Your tool must accept it.')}>
            Trigger alert()
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setConfirmResult(window.confirm('Proceed with the risky operation?') ? 'OK' : 'Cancel')}
          >
            Trigger confirm()
          </Button>
        </div>
        <ChallengeReadout testId="windows-confirm-readout" label="confirm() result" value={confirmResult} />
        <AutomationNote>
          Playwright auto-DISMISSES dialogs unless you register{' '}
          <code>page.on(&apos;dialog&apos;)</code>, which is why an unhandled confirm() reads{' '}
          &quot;Cancel&quot; here. Selenium:{' '}
          <code>switchTo().alert().accept()/dismiss()</code>.
        </AutomationNote>
      </VariantCard>

      <VariantCard name="prompt() & beforeunload" verdict="challenge">
        <Button
          size="sm"
          onClick={() => {
            const answer = window.prompt('What is your favorite test framework?')
            setPromptResult(answer === null ? 'dismissed' : answer || '(empty answer)')
          }}
        >
          Trigger prompt()
        </Button>
        <ChallengeReadout testId="windows-prompt-readout" label="prompt() result" value={promptResult} />
        <label className="flex items-center gap-2 text-xs text-mist-300">
          <input
            type="checkbox"
            checked={guardArmed}
            onChange={(event) => setGuardArmed(event.target.checked)}
            className="accent-volt-400"
          />
          Arm a beforeunload confirmation (then try closing/reloading this tab)
        </label>
        <AutomationNote>
          Answer prompts via <code>dialog.accept(&apos;text&apos;)</code> (Playwright) or{' '}
          <code>alert.sendKeys(…)</code> + accept (Selenium). For beforeunload, close with{' '}
          <code>page.close({'{'} runBeforeUnload: true {'}'})</code> and handle the dialog.
        </AutomationNote>
      </VariantCard>
    </WidgetSection>
  )
}

export default function WindowsPage() {
  return (
    <div>
      <PageIntro
        title="Windows & dialogs"
        what="New tabs, popup windows, a cross-tab localStorage handshake, and the four native dialogs: alert, confirm, prompt and beforeunload."
        how="Every opener points at /frames/result, which writes a handshake value that this page picks up. Dialog answers land in readouts with stable test ids. None of the window mechanics work under jsdom, so drive this page with Playwright or Selenium."
      />
      <DifficultySelector />
      <NewWindowsSection />
      <NativeDialogsSection />
    </div>
  )
}
