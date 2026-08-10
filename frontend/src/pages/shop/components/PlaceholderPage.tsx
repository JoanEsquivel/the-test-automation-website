import { Link } from 'react-router-dom'

import { Banner } from '@/components/ui/Banner'
import { PageIntro } from '@/components/ui/PageIntro'

/** Temporary stand-in for a store page that lands in the next implementation
 * batch. It renders no behavior on purpose — only an honest explanation. */
export function PlaceholderPage({ title, what, how }: { title: string; what: string; how: string }) {
  return (
    <div className="space-y-6">
      <PageIntro title={title} what={what} how={how} />
      <Banner tone="info" data-testid="coming-soon">
        This page is being built right now and lands in the next batch of the ecommerce phase.
        Everything it depends on — the API, the cart engine and the shared store components — is
        already in place.
      </Banner>
      <p>
        <Link to="/shop/catalog" className="text-sm font-medium text-volt-400 hover:underline">
          ← Back to the catalog
        </Link>
      </p>
    </div>
  )
}
