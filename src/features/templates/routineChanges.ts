/** True when the picked exercises (set or order) differ from the saved routine. */
export function hasRoutineChanges(saved: readonly string[], picked: readonly string[]): boolean {
  return saved.length !== picked.length || saved.some((id, i) => id !== picked[i]);
}
