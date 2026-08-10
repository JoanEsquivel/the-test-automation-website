import { PageIntro } from '@/components/ui/PageIntro'

export default function PlaygroundHubPage() {
  return (
    <div>
      <PageIntro
        title="Components Playground"
        what="A catalog of UI elements in multiple implementation variants, plus deliberate automation challenges."
        how="Pick a category below. Each page includes a difficulty selector and marks the recommended modern implementation."
      />
      <p className="text-sm text-mist-400" data-testid="coming-soon">
        Categories are being built in the next implementation phases — check back after the playground phases land.
      </p>
    </div>
  )
}
