import type { Address, AddressInput } from '@/api/types'
import { AddressForm } from './AddressForm'
import type { AddressErrors } from './AddressForm'

export const NEW_ADDRESS_ID = 'new'

function cardClass(selected: boolean): string {
  return `flex items-start gap-3 rounded-2xl border p-4 transition-colors ${
    selected ? 'border-volt-500/60 bg-volt-500/10' : 'border-ink-700 bg-ink-900 hover:border-ink-600'
  }`
}

interface AddressPickerProps {
  addresses: Address[]
  selectedId: string
  onSelect: (id: string) => void
  newAddress: AddressInput
  newAddressErrors: AddressErrors
  onNewAddressChange: (value: AddressInput) => void
}

/** Saved addresses as radio cards, plus an inline form for a brand new one. */
export function AddressPicker({
  addresses,
  selectedId,
  onSelect,
  newAddress,
  newAddressErrors,
  onNewAddressChange,
}: AddressPickerProps) {
  return (
    <div className="space-y-4">
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-mist-200">Ship this order to</legend>

        {addresses.map((address) => (
          <div key={address.id} className={cardClass(selectedId === address.id)}>
            <input
              type="radio"
              id={`address-option-${address.id}`}
              data-testid={`address-option-${address.id}`}
              name="shipping-address"
              value={address.id}
              checked={selectedId === address.id}
              aria-describedby={`address-detail-${address.id}`}
              onChange={() => onSelect(address.id)}
              className="mt-1 size-4 accent-volt-500"
            />
            <div className="text-sm">
              <label
                htmlFor={`address-option-${address.id}`}
                className="font-display block cursor-pointer font-semibold text-mist-50"
              >
                {address.label}
                {address.isDefault ? ' · Default' : ''}
              </label>
              <p id={`address-detail-${address.id}`} className="text-mist-300">
                {address.fullName}
                <span className="block text-mist-400">
                  {address.street}, {address.city} {address.zip}, {address.country}
                </span>
              </p>
            </div>
          </div>
        ))}

        <div className={cardClass(selectedId === NEW_ADDRESS_ID)}>
          <input
            type="radio"
            id={`address-option-${NEW_ADDRESS_ID}`}
            data-testid={`address-option-${NEW_ADDRESS_ID}`}
            name="shipping-address"
            value={NEW_ADDRESS_ID}
            checked={selectedId === NEW_ADDRESS_ID}
            aria-describedby="address-detail-new"
            onChange={() => onSelect(NEW_ADDRESS_ID)}
            className="mt-1 size-4 accent-volt-500"
          />
          <div className="text-sm">
            <label
              htmlFor={`address-option-${NEW_ADDRESS_ID}`}
              className="font-display block cursor-pointer font-semibold text-mist-50"
            >
              Use a new address
            </label>
            <p id="address-detail-new" className="text-mist-400">
              Fill the form below — every field is validated inline.
            </p>
          </div>
        </div>
      </fieldset>

      {selectedId === NEW_ADDRESS_ID && (
        <AddressForm value={newAddress} errors={newAddressErrors} onChange={onNewAddressChange} />
      )}
    </div>
  )
}
