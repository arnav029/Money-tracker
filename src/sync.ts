import { supabase } from './lib/supabase'
import { listCategories, addCategory, putExpenseRaw } from './db'
import type { Category, Expense } from './types'

type RemoteExpenseRow = {
  id: string
  user_id: string
  amount: number
  category: string
  note: string | null
  date: string
  created_at: string
}

async function resolveCategoryId(name: string, categories: Category[]): Promise<{ id: string; categories: Category[] }> {
  const existing = categories.find((c) => c.name.toLowerCase() === name.toLowerCase())
  if (existing) return { id: existing.id, categories }
  const created = await addCategory(name)
  return { id: created.id, categories: [...categories, created] }
}

/** Pulls every remote row for this user into local IndexedDB, creating any missing categories by name. */
export async function pullRemoteExpenses(userId: string): Promise<void> {
  if (!supabase) return
  const { data, error } = await supabase.from('expenses').select('*').eq('user_id', userId)
  if (error || !data) {
    if (error) console.warn('Supabase pull failed:', error.message)
    return
  }

  let categories = await listCategories()
  for (const row of data as RemoteExpenseRow[]) {
    const resolved = await resolveCategoryId(row.category, categories)
    categories = resolved.categories
    const expense: Expense = {
      id: row.id,
      amount: Number(row.amount),
      categoryId: resolved.id,
      note: row.note ?? '',
      date: row.date,
      createdAt: Date.parse(row.created_at)
    }
    await putExpenseRaw(expense)
  }
}

/** Best-effort background push — local IndexedDB is always the source of truth for the current session. */
export async function pushExpenseUpsert(expense: Expense, categoryName: string, userId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('expenses').upsert({
    id: expense.id,
    user_id: userId,
    amount: expense.amount,
    category: categoryName,
    note: expense.note || null,
    date: expense.date,
    created_at: new Date(expense.createdAt).toISOString()
  })
  if (error) console.warn('Supabase push failed:', error.message)
}

export async function pushExpenseDelete(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) console.warn('Supabase delete sync failed:', error.message)
}
