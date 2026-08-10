import { PageIntro } from '@/components/ui/PageIntro'
import { DifficultySelector } from '@/playground/DifficultySelector'
import '@/playground/shadow/shadow-widgets'
import { AutomationNote } from '@/pages/playground/widgets/ChallengeChrome'
import { VariantCard, WidgetSection } from '@/pages/playground/widgets/WidgetChrome'

export default function ShadowPage() {
  return (
    <div>
      <PageIntro
        title="Shadow DOM"
        what="Three vanilla custom elements: an input in an open shadow root, a counter with a NESTED open root, and a vault with a CLOSED root you cannot get into."
        how="Playwright CSS locators pierce OPEN shadow roots on their own. XPath does not, which trips people up. Selenium needs element.getShadowRoot() once per level. Every widget here also mirrors its state onto a light-DOM attribute on the host (data-value, data-count, data-unlocked), so assert those when you cannot pierce, or when you should not."
      />
      <DifficultySelector />

      <WidgetSection
        title="Open shadow roots"
        description="Both tools can reach these: Playwright directly, Selenium through getShadowRoot(). The mirrored host attribute gives you something to assert without piercing anything."
        columns="md:grid-cols-2"
      >
        <VariantCard name="<taw-shadow-input> — open root" verdict="challenge">
          <taw-shadow-input data-testid="shadow-input-host" />
          <p className="text-xs text-mist-500">
            Host mirrors the typed value to <code className="text-volt-300">data-value</code>.
          </p>
          <AutomationNote>
            Playwright: <code>page.getByTestId(&apos;shadow-input-host&apos;).locator(&apos;input&apos;)</code>{' '}
            just works, because open roots are transparent to its CSS locators. Selenium:{' '}
            <code>host.getShadowRoot().findElement(By.cssSelector(&apos;input&apos;))</code>.
          </AutomationNote>
        </VariantCard>

        <VariantCard name="<taw-shadow-counter> — nested open roots" verdict="challenge">
          <taw-shadow-counter data-testid="shadow-counter-host" />
          <p className="text-xs text-mist-500">
            The count display is a second custom element INSIDE the counter&apos;s shadow root,
            with its own shadow root. Host mirrors <code className="text-volt-300">data-count</code>.
          </p>
          <AutomationNote>
            Playwright pierces both levels with one selector. In Selenium you must call{' '}
            <code>getShadowRoot()</code> once per level. Do not cache the handle: the root can be
            re-created under you.
          </AutomationNote>
        </VariantCard>
      </WidgetSection>

      <WidgetSection
        title="Closed shadow root — the evil case"
        description="attachShadow({ mode: 'closed' }) hands the root to the element and nobody else. host.shadowRoot is null, so Playwright's CSS engine and Selenium's getShadowRoot() are both locked out."
        columns="md:grid-cols-1"
      >
        <VariantCard name="<taw-shadow-vault> — closed root" verdict="evil">
          <taw-shadow-vault data-testid="shadow-vault-host" />
          <div className="text-xs leading-relaxed text-mist-400">
            <p>
              There is no handle to query. The DOM inside a closed root is not reachable from
              outside JavaScript at all, so no clever selector is coming to save you. Components
              that ship closed roots, which usually means third-party ones, have to expose testing
              hooks on purpose:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>mirror state to host attributes (this vault sets <code className="text-volt-300">data-unlocked</code>),</li>
              <li>emit composed custom events the page can listen to,</li>
              <li>or provide a documented JavaScript API on the element.</li>
            </ul>
          </div>
          <AutomationNote>
            Do not fight the boundary. Assert the contract the component exposes:{' '}
            <code>expect(host).toHaveAttribute(&apos;data-unlocked&apos;, &apos;true&apos;)</code>.
            A component with no hooks at all is a bug to file, not a locator to hack around.
          </AutomationNote>
        </VariantCard>
      </WidgetSection>
    </div>
  )
}
