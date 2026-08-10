import { PageIntro } from '@/components/ui/PageIntro'
import { DifficultySelector } from '@/playground/DifficultySelector'
import { AutomationNote } from '@/pages/playground/widgets/ChallengeChrome'
import { VariantCard, WidgetSection } from '@/pages/playground/widgets/WidgetChrome'

export default function FramesPage() {
  // Respect the deploy base path (GitHub Pages serves under /the-test-automation-website/).
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')

  return (
    <div>
      <PageIntro
        title="Iframes"
        what="Two embedding challenges: a single iframe with a form that submits INSIDE the frame, and a nested iframe two levels deep."
        how="Your driver talks to the top document by default — elements inside an iframe are invisible to it until you switch context. In Playwright use page.frameLocator('iframe[title=…]') (chain two frameLocator calls for the nested case). In Selenium use driver.switchTo().frame(…) per level, and driver.switchTo().defaultContent() to come back up."
      />
      <DifficultySelector />

      <WidgetSection
        title="Single iframe"
        description="The inner form lives in its own document. Fill it, submit, and assert the result WITHOUT leaving the frame context."
        columns="md:grid-cols-1"
      >
        <VariantCard name='<iframe title="Inner form frame"> → /frames/inner-form' verdict="challenge">
          {/* oxlint-disable-next-line iframe-missing-sandbox -- the embedded page is our own same-origin SPA route; it needs scripts, storage and forms, which sandbox cannot grant together */}
          <iframe title="Inner form frame"
            src={`${base}/frames/inner-form`}
            className="h-[26rem] w-full rounded-xl border border-ink-700"
          />
          <AutomationNote>
            Playwright: <code>page.frameLocator(&apos;iframe[title=&quot;Inner form frame&quot;]&apos;)
            .getByTestId(&apos;frame-name-input&apos;)</code>. Selenium: switch by the iframe
            element, then locate normally; the submitted result renders inside the same frame.
          </AutomationNote>
        </VariantCard>
      </WidgetSection>

      <WidgetSection
        title="Nested iframe"
        description="The outer frame embeds the inner form again — two context switches deep."
        columns="md:grid-cols-1"
      >
        <VariantCard name='<iframe title="Nested frame"> → /frames/outer → /frames/inner-form' verdict="challenge">
          {/* oxlint-disable-next-line iframe-missing-sandbox -- the embedded page is our own same-origin SPA route; it needs scripts, storage and forms, which sandbox cannot grant together */}
          <iframe title="Nested frame"
            src={`${base}/frames/outer`}
            className="h-[34rem] w-full rounded-xl border border-ink-700"
          />
          <AutomationNote>
            Chain the switches: <code>page.frameLocator(&apos;iframe[title=&quot;Nested frame&quot;]&apos;)
            .frameLocator(&apos;iframe[title*=&quot;Inner form&quot;]&apos;)</code> in Playwright;
            in Selenium call <code>switchTo().frame(…)</code> twice — and remember each switch is
            relative to the frame you are currently in.
          </AutomationNote>
        </VariantCard>
      </WidgetSection>
    </div>
  )
}
