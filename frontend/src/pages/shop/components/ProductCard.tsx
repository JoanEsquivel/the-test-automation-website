import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import type { Product } from '@/api/types'
import { formatMoney } from '../format'
import { StarRating } from './StarRating'
import { StockBadge } from './StockBadge'
import { WishlistHeart } from './WishlistHeart'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
  adding?: boolean
  /** Wishlist controls render only for signed-in visitors. */
  showWishlist?: boolean
  wishlisted?: boolean
  wishlistBusy?: boolean
  onToggleWishlist?: (product: Product) => void
}

export function ProductCard({
  product,
  onAddToCart,
  adding = false,
  showWishlist = false,
  wishlisted = false,
  wishlistBusy = false,
  onToggleWishlist,
}: ProductCardProps) {
  const outOfStock = product.stock === 0

  return (
    <article
      data-testid={`product-card-${product.id}`}
      className="flex flex-col rounded-2xl border border-ink-700 bg-ink-900 p-5 transition-colors hover:border-ink-600"
    >
      <div className="flex items-start justify-between gap-3">
        <Link
          to={`/shop/product/${product.id}`}
          data-testid={`product-link-${product.id}`}
          className="grid size-16 place-items-center rounded-xl bg-ink-800 text-4xl"
          aria-label={`View ${product.name}`}
        >
          <span aria-hidden="true">{product.imageEmoji}</span>
        </Link>
        {showWishlist && onToggleWishlist && (
          <WishlistHeart
            productId={product.id}
            productName={product.name}
            active={wishlisted}
            busy={wishlistBusy}
            onToggle={() => onToggleWishlist(product)}
          />
        )}
      </div>

      <h3 className="font-display mt-4 text-base font-semibold leading-snug">
        <Link
          to={`/shop/product/${product.id}`}
          data-testid={`product-name-${product.id}`}
          className="line-clamp-2 break-words hover:text-volt-300"
          title={product.name}
        >
          {product.name}
        </Link>
      </h3>

      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-mist-400">{product.description}</p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span data-testid={`product-price-${product.id}`} className="font-display text-lg font-bold text-mist-50">
          {formatMoney(product.price)}
        </span>
        <StarRating value={product.rating} data-testid={`product-rating-${product.id}`} />
      </div>

      <div className="mt-3">
        <StockBadge stock={product.stock} productId={product.id} />
      </div>

      <Button
        className="mt-4 w-full"
        data-testid={`add-to-cart-${product.id}`}
        disabled={outOfStock || adding}
        onClick={() => onAddToCart(product)}
      >
        {outOfStock ? 'Out of stock' : adding ? 'Adding…' : 'Add to cart'}
      </Button>
    </article>
  )
}
