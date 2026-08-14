const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2
})

export function formatMoney(amount: number): string {
  return currencyFormatter.format(amount)
}

export function todayISO(): string {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 10)
}

export function isSameMonth(dateISO: string, ref: Date = new Date()): boolean {
  const d = new Date(dateISO + 'T00:00:00')
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
}

export function startOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function shiftMonth(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

export function monthYearLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export function formatDateLabel(dateISO: string): string {
  const d = new Date(dateISO + 'T00:00:00')
  const today = todayISO()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yISO = todayISOFrom(yesterday)
  if (dateISO === today) return 'Today'
  if (dateISO === yISO) return 'Yesterday'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function todayISOFrom(d: Date): string {
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 10)
}
