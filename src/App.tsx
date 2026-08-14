import { useEffect, useState, useCallback, useRef } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  ensureSeeded,
  listCategories,
  listExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  addCategory,
  clearLocalExpenses
} from './db'
import type { Category, Expense } from './types'
import { startOfMonth } from './format'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import { pullRemoteExpenses, pushExpenseUpsert, pushExpenseDelete } from './sync'
import Home from './components/Home'
import AddExpense from './components/AddExpense'
import PhoneSignIn from './components/PhoneSignIn'

type View = 'home' | 'add'

export default function App() {
  const [view, setView] = useState<View>('home')
  const [categories, setCategories] = useState<Category[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [viewedMonth, setViewedMonth] = useState(() => startOfMonth())
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured)
  const [syncing, setSyncing] = useState(false)
  const pulledForUserId = useRef<string | null>(null)

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

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      pulledForUserId.current = null
      return
    }
    if (pulledForUserId.current === session.user.id) return
    pulledForUserId.current = session.user.id
    setSyncing(true)
    pullRemoteExpenses(session.user.id)
      .then(refresh)
      .finally(() => setSyncing(false))
  }, [session, refresh])

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
    let saved: Expense
    if (editingExpense) {
      await updateExpense(editingExpense.id, input)
      saved = { ...editingExpense, ...input }
    } else {
      saved = await addExpense(input)
    }
    await refresh()
    closeForm()

    if (session) {
      const categoryName = categories.find((c) => c.id === input.categoryId)?.name ?? 'Other'
      pushExpenseUpsert(saved, categoryName, session.user.id)
    }
  }

  async function handleDelete() {
    if (!editingExpense) return
    const id = editingExpense.id
    await deleteExpense(id)
    await refresh()
    closeForm()

    if (session) {
      pushExpenseDelete(id)
    }
  }

  async function handleAddCategory(name: string): Promise<Category> {
    const cat = await addCategory(name)
    setCategories((prev) => [...prev, cat])
    return cat
  }

  async function handleSignOut() {
    if (!supabase) return
    await supabase.auth.signOut()
    await clearLocalExpenses()
    await refresh()
    closeForm()
  }

  if (!ready || !authReady) {
    return <div className="min-h-dvh bg-surface-plane dark:bg-surface-darkplane" />
  }

  if (isSupabaseConfigured && !session) {
    return (
      <div className="min-h-dvh bg-surface-plane dark:bg-surface-darkplane">
        <PhoneSignIn />
      </div>
    )
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
          accountPhone={session?.user.phone ?? null}
          onSignOut={session ? handleSignOut : undefined}
          syncing={syncing}
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
