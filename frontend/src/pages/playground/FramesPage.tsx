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
        what="Two embedding challenges: one iframe with a form that submits INSIDE the frame, and an iframe nested two levels deep."
        how="Your driver only sees the top document. Anything inside an iframe is invisible until you switch context, which is why a perfectly good selector returns nothing here. In Playwright: page.frameLocator('iframe[title=…]'), chained twice for the nested case. In Selenium: driver.switchTo().frame(…) once per level, then driver.switchTo().defaultContent() to climb back out."
      />
      <DifficultySelector />

      <WidgetSection
        title="Single iframe"
        description="The inner form is its own document. Fill it, submit it, and assert the result WITHOUT leaving the frame context."
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
            .getByTestId(&apos;frame-name-input&apos;)</code>. Selenium: switch to the iframe
            element, then locate normally. The result renders inside the same frame, so do not
            switch back before you assert.
          </AutomationNote>
        </VariantCard>
      </WidgetSection>

      <WidgetSection
        title="Nested iframe"
        description="The outer frame embeds the inner form again, so you are two context switches from the top."
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
            in Selenium, call <code>switchTo().frame(…)</code> twice. Each switch is relative to the
            frame you are already in, not to the top document.
          </AutomationNote>
        </VariantCard>
      </WidgetSection>
    </div>
  )
}
