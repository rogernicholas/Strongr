/**
 * Storage is always canonical (kg, meters, seconds). Convert only for display
 * and input, using the user's unit setting.
 */
export type WeightUnit = 'kg' | 'lb';

export const KG_PER_LB = 0.45359237;

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

export function toDisplayWeight(kg: number, unit: WeightUnit): number {
  return unit === 'kg' ? kg : kgToLb(kg);
}

export function fromDisplayWeight(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? value : lbToKg(value);
}

/** Rounds to at most `decimals` places and drops trailing zeros: 102.5, 100, 225.4. */
export function formatNumber(value: number, decimals = 1): string {
  const factor = 10 ** decimals;
  return String(Math.round(value * factor) / factor);
}
