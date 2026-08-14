import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { v4 as uuid } from 'uuid'
import type { Category, Expense } from './types'

interface PocketDB extends DBSchema {
  expenses: {
    key: string
    value: Expense
    indexes: { 'by-date': string }
  }
  categories: {
    key: string
    value: Category
  }
}

const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Food', colorIndex: 0, isCustom: false },
  { name: 'Transport', colorIndex: 1, isCustom: false },
  { name: 'Bills', colorIndex: 2, isCustom: false },
  { name: 'Shopping', colorIndex: 3, isCustom: false },
  { name: 'Entertainment', colorIndex: 4, isCustom: false },
  { name: 'Other', colorIndex: 5, isCustom: false }
]

let dbPromise: Promise<IDBPDatabase<PocketDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<PocketDB>('pocket-db', 1, {
      upgrade(db) {
        const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' })
        expenseStore.createIndex('by-date', 'date')
        db.createObjectStore('categories', { keyPath: 'id' })
      }
    })
  }
  return dbPromise
}

export async function ensureSeeded() {
  const db = await getDB()
  const count = await db.count('categories')
  if (count === 0) {
    const tx = db.transaction('categories', 'readwrite')
    for (const cat of DEFAULT_CATEGORIES) {
      await tx.store.put({ ...cat, id: uuid() })
    }
    await tx.done
  }
}

export async function listCategories(): Promise<Category[]> {
  const db = await getDB()
  const all = await db.getAll('categories')
  return all.sort((a, b) => a.colorIndex - b.colorIndex)
}

export async function addCategory(name: string): Promise<Category> {
  const db = await getDB()
  const existing = await db.getAll('categories')
  const category: Category = {
    id: uuid(),
    name,
    colorIndex: existing.length,
    isCustom: true
  }
  await db.put('categories', category)
  return category
}

export async function listExpenses(): Promise<Expense[]> {
  const db = await getDB()
  const all = await db.getAll('expenses')
  return all.sort((a, b) => b.createdAt - a.createdAt)
}

export async function addExpense(input: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
  const db = await getDB()
  const expense: Expense = { ...input, id: uuid(), createdAt: Date.now() }
  await db.put('expenses', expense)
  return expense
}

export async function updateExpense(
  id: string,
  input: Omit<Expense, 'id' | 'createdAt'>
): Promise<void> {
  const db = await getDB()
  const existing = await db.get('expenses', id)
  if (!existing) return
  await db.put('expenses', { ...existing, ...input })
}

export async function deleteExpense(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('expenses', id)
}

/** Writes an expense as-is (used to merge rows pulled from the cloud) — no id/createdAt generation. */
export async function putExpenseRaw(expense: Expense): Promise<void> {
  const db = await getDB()
  await db.put('expenses', expense)
}

/** Wipes locally cached expenses, e.g. on sign-out so the next person on this device doesn't see them. */
export async function clearLocalExpenses(): Promise<void> {
  const db = await getDB()
  await db.clear('expenses')
}
