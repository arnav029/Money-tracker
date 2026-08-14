import { useEffect, useState } from 'react'
import type { Category, Expense } from '../types'
import { todayISO } from '../format'
import CategoryPicker from './CategoryPicker'

type Props = {
  categories: Category[]
  editing?: Expense | null
  onCancel: () => void
  onSave: (input: { amount: number; categoryId: string; note: string; date: string }) => Promise<void>
  onAddCategory: (name: string) => Promise<Category>
  onDelete?: () => Promise<void>
}

export default function AddExpense({
  categories,
  editing,
  onCancel,
  onSave,
  onAddCategory,
  onDelete
}: Props) {
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '')
  const [categoryId, setCategoryId] = useState<string | null>(
    editing?.categoryId ?? categories[0]?.id ?? null
  )
  const [note, setNote] = useState(editing?.note ?? '')
  const [date, setDate] = useState(editing?.date ?? todayISO())
  const [saving, setSaving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    if (!confirmingDelete) return
    const t = setTimeout(() => setConfirmingDelete(false), 3000)
    return () => clearTimeout(t)
  }, [confirmingDelete])

  const parsedAmount = Number(amount)
  const canSave = parsedAmount > 0 && !!categoryId && !saving

  async function handleSave() {
    if (!canSave || !categoryId) return
    setSaving(true)
    try {
      await onSave({ amount: parsedAmount, categoryId, note: note.trim(), date })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!onDelete) return
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      return
    }
    await onDelete()
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="flex items-center justify-between px-5 pt-6">
        <div className="flex items-center">
          <button
            type="button"
            onClick={onCancel}
            className="-ml-2 rounded-full p-2 text-ink-secondary dark:text-ink-secondary-dark"
            aria-label="Cancel"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
          <h1 className="ml-1 text-base font-medium">{editing ? 'Edit expense' : 'Add expense'}</h1>
        </div>

        {editing && onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              confirmingDelete
                ? 'bg-cat-8 text-white'
                : 'text-cat-8'
            }`}
          >
            {confirmingDelete ? 'Confirm delete?' : 'Delete'}
          </button>
        )}
      </header>

      <div className="flex-1 space-y-8 px-5 pb-32 pt-6">
        <div>
          <label htmlFor="amount" className="mb-2 block text-sm text-ink-muted">
            Amount
          </label>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-semibold text-ink-muted">$</span>
            <input
              id="amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="tabular w-full bg-transparent text-5xl font-semibold tracking-tight outline-none placeholder:text-line dark:placeholder:text-line-dark"
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-ink-muted">Category</p>
          <CategoryPicker
            categories={categories}
            selectedId={categoryId}
            onSelect={setCategoryId}
            onAddCategory={onAddCategory}
          />
        </div>

        <div>
          <label htmlFor="note" className="mb-2 block text-sm text-ink-muted">
            Note
          </label>
          <input
            id="note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)"
            className="w-full rounded-xl border border-line bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-accent dark:border-line-dark dark:focus:border-accent-dark"
          />
        </div>

        <div>
          <label htmlFor="date" className="mb-2 block text-sm text-ink-muted">
            Date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={todayISO()}
            className="w-full rounded-xl border border-line bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-accent dark:border-line-dark dark:focus:border-accent-dark"
          />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md bg-surface-plane px-5 pb-6 pt-3 dark:bg-surface-darkplane">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="w-full rounded-2xl bg-accent py-3.5 text-base font-semibold text-white transition-opacity disabled:opacity-30 dark:bg-accent-dark dark:text-surface-darkplane"
        >
          {editing ? 'Save changes' : 'Save expense'}
        </button>
      </div>
    </div>
  )
}
