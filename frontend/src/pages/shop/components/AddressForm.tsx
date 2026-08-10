import type { AddressInput } from '@/api/types'
import { TextField } from '@/pages/account/components/TextField'

export type AddressErrors = Partial<Record<keyof AddressInput, string>>

export const EMPTY_ADDRESS: AddressInput = {
  label: '',
  fullName: '',
  street: '',
  city: '',
  zip: '',
  country: '',
  isDefault: false,
}

const FIELDS: { key: keyof AddressInput; label: string; placeholder: string; autoComplete: string }[] = [
  { key: 'label', label: 'Label', placeholder: 'Home', autoComplete: 'off' },
  { key: 'fullName', label: 'Full name', placeholder: 'Casey Customer', autoComplete: 'name' },
  { key: 'street', label: 'Street address', placeholder: '742 Evergreen Terrace', autoComplete: 'street-address' },
  { key: 'city', label: 'City', placeholder: 'Springfield', autoComplete: 'address-level2' },
  { key: 'zip', label: 'ZIP / postal code', placeholder: '49007', autoComplete: 'postal-code' },
  { key: 'country', label: 'Country', placeholder: 'United States', autoComplete: 'country-name' },
]

/** Validates the shipping address exactly like the API does: every field required. */
export function validateAddress(address: AddressInput): AddressErrors {
  const errors: AddressErrors = {}
  for (const field of FIELDS) {
    if (!String(address[field.key] ?? '').trim()) errors[field.key] = `${field.label} is required.`
  }
  if (address.zip.trim() && !/^[\w -]{3,10}$/.test(address.zip.trim())) {
    errors.zip = 'Enter a valid ZIP / postal code (3–10 characters).'
  }
  return errors
}

interface AddressFormProps {
  value: AddressInput
  errors: AddressErrors
  onChange: (value: AddressInput) => void
}

/** New-shipping-address form with inline, per-field validation feedback. */
export function AddressForm({ value, errors, onChange }: AddressFormProps) {
  return (
    <div data-testid="address-form" className="grid gap-4 sm:grid-cols-2">
      {FIELDS.map((field) => (
        <TextField
          key={field.key}
          id={`address-${field.key}`}
          label={field.label}
          placeholder={field.placeholder}
          autoComplete={field.autoComplete}
          value={String(value[field.key] ?? '')}
          error={errors[field.key]}
          onChange={(next) => onChange({ ...value, [field.key]: next })}
        />
      ))}
    </div>
  )
}
