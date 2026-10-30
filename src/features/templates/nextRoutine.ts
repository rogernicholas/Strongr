import type { Routine } from '@/data';

/**
 * The routine after the one trained last, in list order (A, B, C, then A again).
 * Without a known last routine, the first one.
 */
export function nextRoutine(routines: readonly Routine[], lastId: string | null): Routine | null {
  const last = routines.findIndex((r) => r.id === lastId);
  return routines[(last + 1) % routines.length] ?? null;
}
