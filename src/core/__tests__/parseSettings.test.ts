import { defaultSettings } from '@/config/defaults';
import { parseSettings } from '@/core/settings/parseSettings';

describe('parseSettings', () => {
  it('fills missing keys with defaults', () => {
    expect(parseSettings({ weightUnit: 'lb' })).toEqual({ ...defaultSettings, weightUnit: 'lb' });
  });

  it('drops invalid values and unknown keys', () => {
    expect(parseSettings({ weightUnit: 'stone', theme: 3, extra: true })).toEqual(defaultSettings);
  });

  it('turns the rest timer on for installs that stored the old hidden flag', () => {
    expect(parseSettings({ restTimerEnabled: false }).showRestTimer).toBe(true);
  });

  it('keeps the suggestion rep target a whole number from 1 to 50', () => {
    expect(parseSettings({ suggestAtReps: 12 }).suggestAtReps).toBe(12);
    for (const bad of [0, 51, 12.5, '12', null]) {
      expect(parseSettings({ suggestAtReps: bad }).suggestAtReps).toBe(14);
    }
  });

  it('handles non-objects', () => {
    expect(parseSettings(null)).toEqual(defaultSettings);
    expect(parseSettings('nope')).toEqual(defaultSettings);
  });
});
