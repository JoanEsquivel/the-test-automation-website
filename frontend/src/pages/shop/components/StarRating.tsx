interface StarRatingProps {
  /** Average rating, 0–5. `0` means "no reviews yet". */
  value: number
  reviewCount?: number
  size?: 'sm' | 'md' | 'lg'
  'data-testid'?: string
}

const SIZES = { sm: 'text-xs', md: 'text-sm', lg: 'text-xl' } as const

/** Read-only star display. The numeric value is always exposed as text so
 * automation never has to count glyphs. */
export function StarRating({ value, reviewCount, size = 'sm', ...rest }: StarRatingProps) {
  const rounded = Math.round(value)
  const label = value > 0 ? `Rated ${value} out of 5` : 'No ratings yet'

  return (
    <span className={`inline-flex items-center gap-1.5 ${SIZES[size]}`} {...rest}>
      <span aria-hidden="true" className="tracking-tight text-amber-300">
        {'★'.repeat(rounded)}
        <span className="text-ink-600">{'★'.repeat(5 - rounded)}</span>
      </span>
      <span className="font-medium text-mist-400">
        <span className="sr-only">{label}. </span>
        {value > 0 ? value.toFixed(1) : '—'}
      </span>
      {reviewCount !== undefined && (
        <span className="text-mist-500">
          ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </span>
  )
}
