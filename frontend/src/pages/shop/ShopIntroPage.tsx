import { PageIntro } from '@/components/ui/PageIntro'

export default function ShopIntroPage() {
  return (
    <div>
      <PageIntro
        title="TAW Store"
        what="A realistic ecommerce demo with catalog, cart, coupons, checkout, auth, reviews, wishlist and an admin dashboard."
        how="The full store experience arrives in the ecommerce phase. This pre-screen will list every implemented feature, the test credentials and the mode warnings."
      />
      <p className="text-sm text-mist-400" data-testid="coming-soon">
        The store opens in an upcoming implementation phase.
      </p>
    </div>
  )
}
