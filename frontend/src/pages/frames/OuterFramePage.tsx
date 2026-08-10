/**
 * Bare page that itself embeds the inner form — producing a NESTED iframe
 * when /playground/frames embeds THIS page.
 */
export default function OuterFramePage() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return (
    <div data-testid="frame-outer">
      <h1 className="font-display text-lg font-bold text-mist-50">Outer frame</h1>
      <p className="mt-1 text-xs text-mist-400">
        You are one level deep already. The form below sits in ANOTHER iframe inside this one, so
        that is two switches to reach it.
      </p>
      {/* oxlint-disable-next-line iframe-missing-sandbox -- the embedded page is our own same-origin SPA route; it needs scripts, storage and forms, which sandbox cannot grant together */}
      <iframe title="Inner form frame (nested)"
        src={`${base}/frames/inner-form`}
        className="mt-4 h-96 w-full rounded-xl border border-ink-700"
      />
    </div>
  )
}
