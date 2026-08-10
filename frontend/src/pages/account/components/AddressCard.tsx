import type { Address } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface AddressCardProps {
  address: Address
  busy: boolean
  onEdit: (address: Address) => void
  onSetDefault: (address: Address) => void
  onDelete: (address: Address) => void
}

/** One saved address in the profile address book. */
export function AddressCard({ address, busy, onEdit, onSetDefault, onDelete }: AddressCardProps) {
  return (
    <li
      data-testid={`address-card-${address.id}`}
      className="rounded-2xl border border-ink-700 bg-ink-900 p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-base font-bold text-mist-50">{address.label}</h3>
        {address.isDefault && (
          <Badge tone="volt" data-testid={`default-badge-${address.id}`}>
            Default
          </Badge>
        )}
      </div>
      <address className="mt-2 space-y-0.5 text-sm not-italic leading-relaxed text-mist-300">
        <span className="block">{address.fullName}</span>
        <span className="block">{address.street}</span>
        <span className="block">
          {address.city} {address.zip}
        </span>
        <span className="block">{address.country}</span>
      </address>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          data-testid={`edit-address-${address.id}`}
          onClick={() => onEdit(address)}
          disabled={busy}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          data-testid={`set-default-${address.id}`}
          onClick={() => onSetDefault(address)}
          disabled={busy || address.isDefault}
        >
          {address.isDefault ? 'Default address' : 'Set as default'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-300 hover:bg-red-500/10 hover:text-red-200"
          data-testid={`delete-address-${address.id}`}
          onClick={() => onDelete(address)}
          disabled={busy}
        >
          Delete
        </Button>
      </div>
    </li>
  )
}
