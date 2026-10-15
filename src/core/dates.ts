/** "Thursday 15 October 2026" in the given language. */
export function formatLongDate(date: Date, language: string): string {
  return new Intl.DateTimeFormat(language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
