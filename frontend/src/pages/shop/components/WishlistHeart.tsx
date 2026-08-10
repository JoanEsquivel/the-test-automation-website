interface WishlistHeartProps {
  productId: string
  productName: string
  active: boolean
  busy?: boolean
  onToggle: () => void
}

/** Toggle button with a real pressed state (`aria-pressed`) so both humans and
 * automation can read whether the product is on the wishlist. */
export function WishlistHeart({ productId, productName, active, busy = false, onToggle }: WishlistHeartProps) {
  return (
    <button
      type="button"
      data-testid={`wishlist-toggle-${productId}`}
      aria-pressed={active}
      disabled={busy}
      onClick={onToggle}
      title={active ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-label={`${active ? 'Remove' : 'Add'} ${productName} ${active ? 'from' : 'to'} wishlist`}
      className={`grid size-9 shrink-0 place-items-center rounded-full border text-base transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? 'border-pulse-500/50 bg-pulse-500/15 text-pulse-300'
          : 'border-ink-600 bg-ink-800 text-mist-400 hover:border-pulse-500/50 hover:text-pulse-300'
      }`}
    >
      <span aria-hidden="true">{active ? '♥' : '♡'}</span>
    </button>
  )
}
