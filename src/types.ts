export type Category = {
  id: string
  name: string
  /** index into the fixed categorical color order — assigned at creation time, never reassigned */
  colorIndex: number
  isCustom: boolean
}

export type Expense = {
  id: string
  amount: number
  categoryId: string
  note: string
  /** ISO date, yyyy-mm-dd, local */
  date: string
  createdAt: number
}
