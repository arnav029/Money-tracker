import type { Category, Expense } from '../types'
import { colorForIndex } from '../colors'
import { formatMoney } from '../format'

type Props = {
  categories: Category[]
  expenses: Expense[]
}

export default function CategoryBreakdown({ categories, expenses }: Props) {
  const totals = new Map<string, number>()
  for (const e of expenses) {
    totals.set(e.categoryId, (totals.get(e.categoryId) ?? 0) + e.amount)
  }

  const rows = categories
    .map((c) => ({ category: c, total: totals.get(c.id) ?? 0 }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)

  if (rows.length === 0) {
    return null
  }

  const max = rows[0].total

  return (
    <div className="space-y-3">
      {rows.map(({ category, total }) => (
        <div key={category.id} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-sm text-ink-secondary dark:text-ink-secondary-dark">
            {category.name}
          </span>
          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-line dark:bg-line-dark">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max((total / max) * 100, 4)}%`,
                backgroundColor: colorForIndex(category.colorIndex)
              }}
            />
          </div>
          <span className="tabular w-16 shrink-0 text-right text-sm font-medium">
            {formatMoney(total)}
          </span>
        </div>
      ))}
    </div>
  )
}
