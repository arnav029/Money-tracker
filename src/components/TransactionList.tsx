import type { Category, Expense } from '../types'
import { colorForIndex } from '../colors'
import { formatMoney, formatDateLabel } from '../format'

type Props = {
  categories: Category[]
  expenses: Expense[]
  onSelect: (expense: Expense) => void
  emptyMessage?: string
}

export default function TransactionList({
  categories,
  expenses,
  onSelect,
  emptyMessage = 'No expenses yet — tap + to add your first one'
}: Props) {
  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  if (expenses.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line py-10 text-center dark:border-line-dark">
        <p className="text-ink-secondary dark:text-ink-secondary-dark">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-line dark:divide-line-dark">
      {expenses.map((e) => {
        const category = categoryMap.get(e.categoryId)
        return (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => onSelect(e)}
              className="flex w-full items-center gap-3 py-3 text-left transition-opacity active:opacity-60"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: colorForIndex(category?.colorIndex ?? 5) }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{category?.name ?? 'Other'}</p>
                {e.note && <p className="truncate text-xs text-ink-muted">{e.note}</p>}
              </div>
              <span className="shrink-0 text-xs text-ink-muted">{formatDateLabel(e.date)}</span>
              <span className="tabular w-20 shrink-0 text-right text-sm font-semibold">
                {formatMoney(e.amount)}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
