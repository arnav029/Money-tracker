import type { Category, Expense } from '../types'
import { formatMoney, isSameMonth } from '../format'
import CategoryBreakdown from './CategoryBreakdown'
import TransactionList from './TransactionList'

type Props = {
  categories: Category[]
  expenses: Expense[]
  onAdd: () => void
  onSelectExpense: (expense: Expense) => void
}

export default function Home({ categories, expenses, onAdd, onSelectExpense }: Props) {
  const monthExpenses = expenses.filter((e) => isSameMonth(e.date))
  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0)
  const monthLabel = new Date().toLocaleDateString(undefined, { month: 'long' })

  return (
    <div className="mx-auto max-w-md pb-28">
      <header className="px-5 pb-2 pt-8">
        <p className="text-sm text-ink-muted">{monthLabel} total</p>
        <p className="tabular text-4xl font-semibold tracking-tight">{formatMoney(monthTotal)}</p>
      </header>

      {monthExpenses.length > 0 && (
        <section className="px-5 py-4">
          <CategoryBreakdown categories={categories} expenses={monthExpenses} />
        </section>
      )}

      <section className="px-5 pt-4">
        <h2 className="mb-1 text-sm font-medium text-ink-secondary dark:text-ink-secondary-dark">
          Recent
        </h2>
        <TransactionList categories={categories} expenses={expenses} onSelect={onSelectExpense} />
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
