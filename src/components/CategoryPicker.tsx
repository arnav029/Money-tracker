import { useState } from 'react'
import type { Category } from '../types'
import { colorForIndex } from '../colors'

type Props = {
  categories: Category[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAddCategory: (name: string) => Promise<Category>
}

export default function CategoryPicker({ categories, selectedId, onSelect, onAddCategory }: Props) {
  const [adding, setAdding] = useState(false)
  const [draftName, setDraftName] = useState('')

  async function confirmAdd() {
    const name = draftName.trim()
    if (!name) {
      setAdding(false)
      return
    }
    const cat = await onAddCategory(name)
    onSelect(cat.id)
    setDraftName('')
    setAdding(false)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((c) => {
        const active = c.id === selectedId
        const color = colorForIndex(c.colorIndex)
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
              active ? '' : 'border-line dark:border-line-dark'
            }`}
            style={active ? { backgroundColor: color, borderColor: color, color: '#fff' } : undefined}
          >
            {!active && (
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
            )}
            {c.name}
          </button>
        )
      })}

      {adding ? (
        <div className="flex items-center gap-1 rounded-full border border-line px-2 py-1 dark:border-line-dark">
          <input
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmAdd()
              if (e.key === 'Escape') {
                setAdding(false)
                setDraftName('')
              }
            }}
            placeholder="Category name"
            className="w-28 bg-transparent px-1 py-1 text-sm outline-none"
          />
          <button
            type="button"
            onClick={confirmAdd}
            className="rounded-full bg-accent px-2 py-1 text-xs font-semibold text-white dark:bg-accent-dark dark:text-surface-darkplane"
          >
            Add
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 rounded-full border border-dashed border-line px-3.5 py-2 text-sm text-ink-muted dark:border-line-dark"
        >
          + New
        </button>
      )}
    </div>
  )
}
