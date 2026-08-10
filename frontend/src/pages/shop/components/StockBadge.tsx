import { Badge } from '@/components/ui/Badge'

/** Normative thresholds (ecommerce-spec.md): 0 → "Out of stock",
 * below 5 → "Only N left", otherwise "In stock". */
export function StockBadge({ stock, productId }: { stock: number; productId?: string }) {
  const testId = productId ? `stock-badge-${productId}` : 'stock-badge'

  if (stock === 0) {
    return (
      <Badge tone="danger" data-testid={testId}>
        Out of stock
      </Badge>
    )
  }
  if (stock < 5) {
    return (
      <Badge tone="warning" data-testid={testId}>
        Only {stock} left
      </Badge>
    )
  }
  return (
    <Badge tone="success" data-testid={testId}>
      In stock
    </Badge>
  )
}
