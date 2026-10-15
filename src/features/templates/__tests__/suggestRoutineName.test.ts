import { suggestRoutineName } from '../suggestRoutineName';

describe('suggestRoutineName', () => {
  it('suggests the first free letter', () => {
    expect(suggestRoutineName([])).toBe('A');
    expect(suggestRoutineName(['a', 'B', 'Push'])).toBe('C');
  });

  it('gives up after Z', () => {
    const all = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
    expect(suggestRoutineName(all)).toBe('');
  });
});
