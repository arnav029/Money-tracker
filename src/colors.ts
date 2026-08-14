// Fixed categorical order — validated for adjacent CVD/contrast separation.
// Never cycle/reassign; a category keeps the slot it was created with.
export const CATEGORY_COLORS = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948' // red
]

export function colorForIndex(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length]
}
