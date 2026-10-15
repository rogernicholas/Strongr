import { formatNumber, fromDisplayWeight, kgToLb, lbToKg, toDisplayWeight } from '@/core/units';

describe('units', () => {
  it('round-trips kg and lb', () => {
    expect(lbToKg(kgToLb(100))).toBeCloseTo(100, 10);
    expect(kgToLb(100)).toBeCloseTo(220.462, 3);
  });

  it('only converts for display when the unit is lb', () => {
    expect(toDisplayWeight(100, 'kg')).toBe(100);
    expect(fromDisplayWeight(225, 'lb')).toBeCloseTo(102.058, 3);
  });

  it('formats without trailing zeros', () => {
    expect(formatNumber(100)).toBe('100');
    expect(formatNumber(102.5)).toBe('102.5');
    expect(formatNumber(220.46226)).toBe('220.5');
  });
});
