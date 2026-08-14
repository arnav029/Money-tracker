import { useEffect, useState, useCallback } from 'react'
import {
  ensureSeeded,
  listCategories,
  listExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  addCategory
} from './db'
import type { Category, Expense } from './types'
import { startOfMonth } from './format'
import Home from './components/Home'
import AddExpense from './components/AddExpense'

type View = 'home' | 'add'

export default function App() {
  const [view, setView] = useState<View>('home')
  const [categories, setCategories] = useState<Category[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [viewedMonth, setViewedMonth] = useState(() => startOfMonth())
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    const [cats, exps] = await Promise.all([listCategories(), listExpenses()])
    setCategories(cats)
    setExpenses(exps)
  }, [])

  useEffect(() => {
    ensureSeeded()
      .then(refresh)
      .then(() => setReady(true))
  }, [refresh])

  function openAdd() {
    setEditingExpense(null)
    setView('add')
  }

  function openEdit(expense: Expense) {
    setEditingExpense(expense)
    setView('add')
  }

  function closeForm() {
    setEditingExpense(null)
    setView('home')
  }

  async function handleSave(input: { amount: number; categoryId: string; note: string; date: string }) {
    if (editingExpense) {
      await updateExpense(editingExpense.id, input)
    } else {
      await addExpense(input)
    }
    await refresh()
    closeForm()
  }

  async function handleDelete() {
    if (!editingExpense) return
    await deleteExpense(editingExpense.id)
    await refresh()
    closeForm()
  }

  async function handleAddCategory(name: string): Promise<Category> {
    const cat = await addCategory(name)
    setCategories((prev) => [...prev, cat])
    return cat
  }

  if (!ready) {
    return <div className="min-h-dvh bg-surface-plane dark:bg-surface-darkplane" />
  }

  return (
    <div className="min-h-dvh bg-surface-plane dark:bg-surface-darkplane">
      {view === 'home' && (
        <Home
          categories={categories}
          expenses={expenses}
          onAdd={openAdd}
          onSelectExpense={openEdit}
          viewedMonth={viewedMonth}
          onChangeMonth={setViewedMonth}
        />
      )}
      {view === 'add' && (
        <AddExpense
          categories={categories}
          editing={editingExpense}
          onCancel={closeForm}
          onSave={handleSave}
          onAddCategory={handleAddCategory}
          onDelete={editingExpense ? handleDelete : undefined}
        />
      )}
    </div>
  )
}
