import type { Category, Expense } from '../types'
import { formatMoney, isSameMonth, shiftMonth, monthYearLabel, todayISO } from '../format'
import CategoryBreakdown from './CategoryBreakdown'
import TransactionList from './TransactionList'

type Props = {
  categories: Category[]
  expenses: Expense[]
  onAdd: () => void
  onSelectExpense: (expense: Expense) => void
  viewedMonth: Date
  onChangeMonth: (updater: (current: Date) => Date) => void
}

export default function Home({
  categories,
  expenses,
  onAdd,
  onSelectExpense,
  viewedMonth,
  onChangeMonth
}: Props) {
  const isCurrentMonth = isSameMonth(todayISO(), viewedMonth)
  const monthExpenses = expenses.filter((e) => isSameMonth(e.date, viewedMonth))
  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0)

  const emptyMessage =
    expenses.length === 0
      ? 'No expenses yet — tap + to add your first one'
      : `No expenses in ${monthYearLabel(viewedMonth)}`

  return (
    <div className="mx-auto max-w-md pb-28">
      <header className="px-5 pb-2 pt-8">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChangeMonth((m) => shiftMonth(m, -1))}
            aria-label="Previous month"
            className="-ml-2 rounded-full p-2 text-ink-muted active:opacity-60"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <p className="text-sm text-ink-muted">
            {monthYearLabel(viewedMonth)}
            {isCurrentMonth ? ' · this month' : ''}
          </p>
          <button
            type="button"
            onClick={() => onChangeMonth((m) => shiftMonth(m, 1))}
            aria-label="Next month"
            disabled={isCurrentMonth}
            className="rounded-full p-2 text-ink-muted disabled:opacity-0 active:opacity-60"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <p className="tabular text-4xl font-semibold tracking-tight">{formatMoney(monthTotal)}</p>
      </header>

      {monthExpenses.length > 0 && (
        <section className="px-5 py-4">
          <CategoryBreakdown categories={categories} expenses={monthExpenses} />
        </section>
      )}

      <section className="px-5 pt-4">
        <h2 className="mb-1 text-sm font-medium text-ink-secondary dark:text-ink-secondary-dark">
          Transactions
        </h2>
        <TransactionList
          categories={categories}
          expenses={monthExpenses}
          onSelect={onSelectExpense}
          emptyMessage={emptyMessage}
        />
      </section>

      <button
        type="button"
        onClick={onAdd}
        aria-label="Add expense"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl font-light text-white shadow-lg shadow-accent/30 transition-transform active:scale-95 dark:bg-accent-dark dark:text-surface-darkplane"
      >
        +
      </button>
    </div>
  )
}
