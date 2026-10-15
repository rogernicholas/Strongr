import { defaultSettings } from '@/config/defaults';
import { parseSettings } from '@/core/settings/parseSettings';

describe('parseSettings', () => {
  it('fills missing keys with defaults', () => {
    expect(parseSettings({ weightUnit: 'lb' })).toEqual({ ...defaultSettings, weightUnit: 'lb' });
  });

  it('drops invalid values and unknown keys', () => {
    expect(parseSettings({ weightUnit: 'stone', theme: 3, extra: true })).toEqual(defaultSettings);
  });

  it('handles non-objects', () => {
    expect(parseSettings(null)).toEqual(defaultSettings);
    expect(parseSettings('nope')).toEqual(defaultSettings);
  });
});
