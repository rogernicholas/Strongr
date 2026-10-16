import type { WeightUnit } from '@/core/units';

/** Every user-facing option, in one object. */
export interface Settings {
  weightUnit: WeightUnit;
  rpeEnabled: boolean;
  restTimerEnabled: boolean;
  plateCalculatorEnabled: boolean;
  socialEnabled: boolean;
}

export const defaultSettings: Settings = {
  weightUnit: 'kg',
  rpeEnabled: false,
  restTimerEnabled: false,
  plateCalculatorEnabled: false,
  socialEnabled: false,
};

export const DEFAULT_LANGUAGE = 'en';
