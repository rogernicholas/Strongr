/** Next free single letter (A, B, C…), matching how Roger names routines. */
export function suggestRoutineName(existing: readonly string[]): string {
  const taken = new Set(existing.map((n) => n.trim().toUpperCase()));
  for (let code = 65; code <= 90; code++) {
    const letter = String.fromCharCode(code);
    if (!taken.has(letter)) return letter;
  }
  return '';
}
