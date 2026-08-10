const MONEY = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const DATE = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

/** Store-wide money formatting — always `$1,234.50`. */
export function formatMoney(amount: number): string {
  return MONEY.format(amount)
}

export function formatDate(iso: string): string {
  return DATE.format(new Date(iso))
}
