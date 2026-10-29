import type { WeightUnit } from '@/core/units';

/** Every user-facing option, in one object. */
export interface Settings {
  weightUnit: WeightUnit;
  rpeEnabled: boolean;
  /**
   * Count-up rest clock on the workout screen. Replaces the never-shown `restTimerEnabled`
   * (stored as false on early installs), so the new default reaches everyone.
   */
  showRestTimer: boolean;
  /** "Try more weight" lines on the good-job screen. */
  weightSuggestions: boolean;
  /** Reps every working set must reach before more weight is suggested. */
  suggestAtReps: number;
  plateCalculatorEnabled: boolean;
  socialEnabled: boolean;
}

export const defaultSettings: Settings = {
  weightUnit: 'kg',
  rpeEnabled: false,
  showRestTimer: true,
  weightSuggestions: true,
  suggestAtReps: 14,
  plateCalculatorEnabled: false,
  socialEnabled: false,
};

export const DEFAULT_LANGUAGE = 'en';
