import type { Order } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import type { BadgeTone } from '@/components/ui/Badge'

export type OrderStatus = Order['status']

const FLOW: { id: Exclude<OrderStatus, 'cancelled'>; label: string; blurb: string }[] = [
  { id: 'pending', label: 'Pending', blurb: 'Order created, payment not captured yet.' },
  { id: 'paid', label: 'Paid', blurb: 'Simulated payment approved, stock decremented.' },
  { id: 'shipped', label: 'Shipped', blurb: 'Handed over to the carrier.' },
  { id: 'delivered', label: 'Delivered', blurb: 'Arrived at the shipping address.' },
]

const TONES: Record<OrderStatus, BadgeTone> = {
  pending: 'warning',
  paid: 'success',
  shipped: 'volt',
  delivered: 'success',
  cancelled: 'danger',
}

const LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

/** Status pill shared by the order list and the order detail page. */
export function OrderStatusChip({ status, orderNumber }: { status: OrderStatus; orderNumber?: string }) {
  return (
    <Badge tone={TONES[status]} data-testid={orderNumber ? `order-status-${orderNumber}` : 'order-status'}>
      {LABELS[status]}
    </Badge>
  )
}

/** `pending → paid → shipped → delivered` with the reached steps marked.
 * A cancelled order keeps the steps it reached and shows the cancellation last. */
export function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  const cancelled = status === 'cancelled'
  // A cancelled order was at least paid in this demo (checkout always captures),
  // so the timeline stops at the last step it can prove: `paid`.
  const currentIndex = cancelled ? FLOW.findIndex((step) => step.id === 'paid') : FLOW.findIndex((step) => step.id === status)

  return (
    <section
      data-testid="order-timeline"
      aria-label="Order status timeline"
      className="rounded-2xl border border-ink-700 bg-ink-900 p-6"
    >
      <h2 className="font-display text-base font-bold text-mist-50">Status timeline</h2>
      <ol className="mt-4 space-y-0">
        {FLOW.map((step, index) => {
          const state = index < currentIndex ? 'complete' : index === currentIndex && !cancelled ? 'current' : index === currentIndex ? 'complete' : 'upcoming'
          return (
            <li key={step.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span
                  aria-hidden="true"
                  className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    state === 'current'
                      ? 'bg-volt-500 text-ink-950'
                      : state === 'complete'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-ink-700 text-mist-500'
                  }`}
                >
                  {state === 'upcoming' ? index + 1 : '✓'}
                </span>
                {index < FLOW.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={`w-px flex-1 ${index < currentIndex ? 'bg-emerald-500/40' : 'bg-ink-700'}`}
                  />
                )}
              </div>
              <div
                data-testid={`timeline-step-${step.id}`}
                data-state={state}
                aria-current={state === 'current' ? 'step' : undefined}
                className="pb-5"
              >
                <p className={`text-sm font-semibold ${state === 'upcoming' ? 'text-mist-500' : 'text-mist-50'}`}>
                  {step.label}
                </p>
                <p className="text-xs text-mist-400">{step.blurb}</p>
              </div>
            </li>
          )
        })}
      </ol>

      {cancelled && (
        <p
          data-testid="timeline-step-cancelled"
          data-state="current"
          aria-current="step"
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          This order was cancelled. It will not ship and the remaining steps never run.
        </p>
      )}
    </section>
  )
}
