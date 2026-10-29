import { defaultSettings, type Settings } from '@/config/defaults';

const WEIGHT_UNITS = ['kg', 'lb'] as const;

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/** Rep target for weight suggestions: a whole number in this range. */
export const SUGGEST_REPS_RANGE = { min: 1, max: 50 } as const;

function reps(value: unknown, fallback: number): number {
  const { min, max } = SUGGEST_REPS_RANGE;
  return Number.isInteger(value) && (value as number) >= min && (value as number) <= max
    ? (value as number)
    : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/**
 * Turns whatever was stored (possibly from an older app version, or corrupt)
 * into a complete, valid Settings object. Unknown keys are dropped and
 * missing or invalid ones fall back to defaults.
 */
export function parseSettings(raw: unknown): Settings {
  const input = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const d = defaultSettings;
  return {
    weightUnit: pick(input.weightUnit, WEIGHT_UNITS, d.weightUnit),
    rpeEnabled: bool(input.rpeEnabled, d.rpeEnabled),
    showRestTimer: bool(input.showRestTimer, d.showRestTimer),
    weightSuggestions: bool(input.weightSuggestions, d.weightSuggestions),
    suggestAtReps: reps(input.suggestAtReps, d.suggestAtReps),
    plateCalculatorEnabled: bool(input.plateCalculatorEnabled, d.plateCalculatorEnabled),
    socialEnabled: bool(input.socialEnabled, d.socialEnabled),
  };
}
