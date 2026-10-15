// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

const FEATURES = [
  'exercises',
  'templates',
  'logging',
  'history',
  'progress',
  'backup',
  'social',
  'settings',
];

const SQLITE_ONLY_IN_DATA = {
  name: 'expo-sqlite',
  message: 'Only src/data and src/core/db may talk to SQLite. Go through a repository.',
};

// Architecture rules from CLAUDE.md, enforced by the linter.
module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  { ignores: ['dist/*', '.expo/*', 'android/*', 'ios/*'] },
  ...FEATURES.map((feature) => ({
    files: [`src/features/${feature}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [SQLITE_ONLY_IN_DATA],
          patterns: [
            {
              group: FEATURES.filter((f) => f !== feature).flatMap((f) => [
                `@/features/${f}`,
                `@/features/${f}/**`,
                `**/features/${f}`,
                `**/features/${f}/**`,
              ]),
              message:
                'Features never import from each other. Move shared code to core, data, ui or config.',
            },
            { group: ['@/app', '@/app/**'], message: 'Only the app shell composes features.' },
          ],
        },
      ],
    },
  })),
  {
    // ui and config are leaves: no database, no features.
    files: ['src/ui/**/*.{ts,tsx}', 'src/config/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [SQLITE_ONLY_IN_DATA],
          patterns: [
            {
              group: ['@/features/**', '@/app/**', '@/data/**'],
              message: 'ui and config must not depend on features, app or data.',
            },
          ],
        },
      ],
    },
  },
  {
    // core is the bottom layer; only core/db may open SQLite.
    files: ['src/core/**/*.{ts,tsx}'],
    ignores: ['src/core/db/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [SQLITE_ONLY_IN_DATA],
          patterns: [
            {
              group: ['@/features/**', '@/app/**', '@/data/**', '@/ui/**'],
              message: 'core must not depend on higher layers.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/data/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/**', '@/app/**', '@/ui/**'],
              message: 'data must not depend on features, app or ui.',
            },
          ],
        },
      ],
    },
  },
]);
