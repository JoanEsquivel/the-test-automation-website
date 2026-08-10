import { Link } from 'react-router-dom'

import type { CartItem, Product } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { formatMoney } from '../format'
import { QtyStepper } from './QtyStepper'

interface CartLineItemProps {
  item: CartItem
  /** Catalog record for the line, when it has been fetched (emoji + stock cap). */
  product?: Product
  busy?: boolean
  onQtyChange: (productId: string, qty: number) => void
  onRemove: (item: CartItem) => void
}

/** One row of the cart: art, name, unit price, quantity stepper and line total. */
export function CartLineItem({ item, product, busy = false, onQtyChange, onRemove }: CartLineItemProps) {
  const maxQty = Math.min(99, Math.max(product?.stock ?? 99, item.qty))

  return (
    <article
      data-testid={`cart-item-${item.productId}`}
      className="flex flex-wrap items-start gap-4 rounded-2xl border border-ink-700 bg-ink-900 p-5 sm:flex-nowrap"
    >
      <Link
        to={`/shop/product/${item.productId}`}
        data-testid={`cart-item-art-${item.productId}`}
        className="grid size-16 shrink-0 place-items-center rounded-xl bg-ink-800 text-4xl"
        aria-label={`View ${item.name}`}
      >
        <span aria-hidden="true">{product?.imageEmoji ?? '🛍️'}</span>
      </Link>

      <div className="min-w-[10rem] flex-1">
        <h3 className="font-display text-base font-semibold leading-snug">
          <Link
            to={`/shop/product/${item.productId}`}
            data-testid={`cart-item-name-${item.productId}`}
            className="break-words hover:text-volt-300"
          >
            {item.name}
          </Link>
        </h3>
        <p data-testid={`cart-item-unit-price-${item.productId}`} className="mt-1 text-sm text-mist-400">
          {formatMoney(item.unitPrice)} each
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 -ml-3 text-red-300 hover:text-red-200"
          data-testid={`remove-item-${item.productId}`}
          disabled={busy}
          onClick={() => onRemove(item)}
        >
          Remove
        </Button>
      </div>

      <QtyStepper
        value={item.qty}
        max={maxQty}
        disabled={busy}
        idSuffix={item.productId}
        label="Qty"
        onChange={(qty) => onQtyChange(item.productId, qty)}
      />

      <p
        data-testid={`cart-item-total-${item.productId}`}
        className="font-display ml-auto text-lg font-bold tabular-nums text-mist-50"
      >
        {formatMoney(item.lineTotal)}
      </p>
    </article>
  )
}
