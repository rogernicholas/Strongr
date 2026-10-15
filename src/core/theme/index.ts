import { useColorScheme } from 'react-native';

import { useSettings } from '@/core/settings';

export interface Theme {
  dark: boolean;
  colors: {
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    primary: string;
    onPrimary: string;
    border: string;
    danger: string;
  };
  spacing: (n: number) => number;
  /** Minimum tap target; the logging screen uses larger ones. */
  minTouch: number;
}

const spacing = (n: number) => n * 4;

export const lightTheme: Theme = {
  dark: false,
  colors: {
    background: '#F7F7F8',
    surface: '#FFFFFF',
    text: '#111114',
    textMuted: '#5E5E66',
    primary: '#1F6FEB',
    onPrimary: '#FFFFFF',
    border: '#DADADF',
    danger: '#C62828',
  },
  spacing,
  minTouch: 48,
};

export const darkTheme: Theme = {
  dark: true,
  colors: {
    background: '#0F0F12',
    surface: '#1A1A1F',
    text: '#F2F2F5',
    textMuted: '#A0A0AA',
    primary: '#4C8DFF',
    onPrimary: '#0F0F12',
    border: '#2E2E36',
    danger: '#EF5350',
  },
  spacing,
  minTouch: 48,
};

export function useTheme(): Theme {
  const system = useColorScheme();
  const { settings } = useSettings();
  const mode = settings.theme === 'system' ? (system ?? 'light') : settings.theme;
  return mode === 'dark' ? darkTheme : lightTheme;
}
