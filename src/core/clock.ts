/** Current time as epoch milliseconds (UTC). Swappable in tests. */
export type Clock = () => number;

export const systemClock: Clock = () => Date.now();

/** The device's IANA timezone, e.g. "Europe/Prague". */
export function currentTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
}
