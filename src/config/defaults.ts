import type { WeightUnit } from '@/core/units';

export type ThemePreference = 'system' | 'light' | 'dark';

/** Every user-facing option, in one object. */
export interface Settings {
  weightUnit: WeightUnit;
  theme: ThemePreference;
  rpeEnabled: boolean;
  restTimerEnabled: boolean;
  plateCalculatorEnabled: boolean;
  socialEnabled: boolean;
}

export const defaultSettings: Settings = {
  weightUnit: 'kg',
  theme: 'system',
  rpeEnabled: true,
  restTimerEnabled: true,
  plateCalculatorEnabled: false,
  socialEnabled: false,
};

export const DEFAULT_LANGUAGE = 'en';
