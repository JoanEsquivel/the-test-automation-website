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
        what="Three vanilla custom elements: an open shadow input, a counter with a NESTED open shadow root, and a vault with a CLOSED root — the near-unautomatable case."
        how="Playwright locators pierce OPEN shadow roots automatically (CSS engine limitation aside: XPath does not). Selenium needs element.getShadowRoot() per level. Every widget here also mirrors its state to a light-DOM attribute on the host (data-value / data-count / data-unlocked) — assert those when you cannot, or should not, pierce."
      />
      <DifficultySelector />

      <WidgetSection
        title="Open shadow roots"
        description="Reachable by tools — directly in Playwright, via getShadowRoot() in Selenium. The host attribute mirror gives you a piercing-free assertion target."
        columns="md:grid-cols-2"
      >
        <VariantCard name="<taw-shadow-input> — open root" verdict="challenge">
          <taw-shadow-input data-testid="shadow-input-host" />
          <p className="text-xs text-mist-500">
            Host mirrors the typed value to <code className="text-volt-300">data-value</code>.
          </p>
          <AutomationNote>
            Playwright: <code>page.getByTestId(&apos;shadow-input-host&apos;).locator(&apos;input&apos;)</code>{' '}
            just works — open roots are transparent to its CSS locators. Selenium:{' '}
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
            <code>getShadowRoot()</code> once per level — cache nothing, roots can be re-created.
          </AutomationNote>
        </VariantCard>
      </WidgetSection>

      <WidgetSection
        title="Closed shadow root — the evil case"
        description="attachShadow({ mode: 'closed' }) returns a root the element keeps private: host.shadowRoot is null, so neither Playwright's CSS engine nor Selenium's getShadowRoot() can enter."
        columns="md:grid-cols-1"
      >
        <VariantCard name="<taw-shadow-vault> — closed root" verdict="evil">
          <taw-shadow-vault data-testid="shadow-vault-host" />
          <div className="text-xs leading-relaxed text-mist-400">
            <p>
              Why is this near-unautomatable? The DOM inside a closed root is simply not
              reachable from outside JavaScript — there is no handle to query. Real applications
              that ship closed roots (or web components from third-party vendors) must expose
              deliberate testing hooks instead:
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
            If a component offers no hooks at all, that is a bug to file, not a locator to hack.
          </AutomationNote>
        </VariantCard>
      </WidgetSection>
    </div>
  )
}
