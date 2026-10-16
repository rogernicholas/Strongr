/** @jest-environment node */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import en from '@/core/i18n/locales/en.json';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sourceFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

function hasKey(key: string): boolean {
  let node: unknown = en;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return false;
    node = (node as Record<string, unknown>)[part];
  }
  return node !== undefined;
}

describe('translations', () => {
  it('every literal t() key exists in en.json (plural keys via _one)', () => {
    const missing: string[] = [];
    for (const file of sourceFiles(join(__dirname, '..', 'src'))) {
      const source = readFileSync(file, 'utf8');
      for (const [, key] of source.matchAll(/\bt\('([\w.]+)'/g)) {
        if (!hasKey(key!) && !hasKey(`${key}_one`)) missing.push(`${file}: ${key}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
