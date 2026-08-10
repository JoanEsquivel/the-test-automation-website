import type { PaymentInput } from '@/api/types'
import { TextField } from '@/pages/account/components/TextField'

export type PaymentErrors = Partial<Record<keyof PaymentInput, string>>

export const EMPTY_PAYMENT: PaymentInput = { cardNumber: '', expiry: '', cvc: '', cardHolder: '' }

/** `#### #### #### ####` — groups of four, 19 digits max (contract allows 13–19). */
export function maskCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 19)
  return (digits.match(/.{1,4}/g) ?? []).join(' ')
}

/** `MM/YY` — the slash appears by itself as soon as the month is complete. */
export function maskExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export function maskCvc(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 4)
}

/** Client-side mirror of the API's payment rules — minus the Luhn/decline checks,
 * which are the server's simulation and must be allowed to reach it. */
export function validatePayment(payment: PaymentInput): PaymentErrors {
  const errors: PaymentErrors = {}
  const digits = payment.cardNumber.replace(/\D/g, '')
  if (!digits) errors.cardNumber = 'Card number is required.'
  else if (digits.length < 13 || digits.length > 19) errors.cardNumber = 'Card number must be 13–19 digits.'

  const expiryMatch = /^(\d{2})\/(\d{2})$/.exec(payment.expiry)
  if (!payment.expiry.trim()) {
    errors.expiry = 'Expiry date is required.'
  } else if (!expiryMatch) {
    errors.expiry = 'Use the MM/YY format.'
  } else {
    const month = Number(expiryMatch[1])
    const year = 2000 + Number(expiryMatch[2])
    const now = new Date()
    if (month < 1 || month > 12) errors.expiry = 'Month must be between 01 and 12.'
    else if (year * 12 + month < now.getFullYear() * 12 + now.getMonth() + 1) errors.expiry = 'The card has expired.'
  }

  if (!payment.cvc) errors.cvc = 'CVC is required.'
  else if (!/^\d{3,4}$/.test(payment.cvc)) errors.cvc = 'CVC must be 3 or 4 digits.'

  if (!payment.cardHolder.trim()) errors.cardHolder = 'Cardholder name is required.'

  return errors
}

export function cardLast4(cardNumber: string): string {
  return cardNumber.replace(/\D/g, '').slice(-4)
}

interface PaymentFormProps {
  value: PaymentInput
  errors: PaymentErrors
  onChange: (value: PaymentInput) => void
}

/** Simulated card form: masked as you type, validated per field. */
export function PaymentForm({ value, errors, onChange }: PaymentFormProps) {
  return (
    <div data-testid="payment-form" className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <TextField
          id="card-number"
          label="Card number"
          placeholder="4111 1111 1111 1111"
          autoComplete="cc-number"
          hint="4111 1111 1111 1111 is approved; any card ending in 0000 is declined."
          value={value.cardNumber}
          error={errors.cardNumber}
          onChange={(next) => onChange({ ...value, cardNumber: maskCardNumber(next) })}
        />
      </div>

      <TextField
        id="card-expiry"
        label="Expiry (MM/YY)"
        placeholder="12/30"
        autoComplete="cc-exp"
        value={value.expiry}
        error={errors.expiry}
        onChange={(next) => onChange({ ...value, expiry: maskExpiry(next) })}
      />

      <TextField
        id="card-cvc"
        label="CVC"
        placeholder="123"
        autoComplete="cc-csc"
        value={value.cvc}
        error={errors.cvc}
        onChange={(next) => onChange({ ...value, cvc: maskCvc(next) })}
      />

      <div className="sm:col-span-2">
        <TextField
          id="card-holder"
          label="Cardholder name"
          placeholder="Casey Customer"
          autoComplete="cc-name"
          value={value.cardHolder}
          error={errors.cardHolder}
          onChange={(next) => onChange({ ...value, cardHolder: next })}
        />
      </div>
    </div>
  )
}
