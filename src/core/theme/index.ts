export interface Theme {
  dark: boolean;
  colors: {
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    /** Main actions (red). */
    primary: string;
    onPrimary: string;
    /** Highlights: today, selection, dots, graph lines (teal). */
    accent: string;
    onAccent: string;
    /** Borders are off in the night theme (transparent). */
    border: string;
    /** Faint lines that must stay visible: chart grid, page dots, empty checkboxes. */
    subtle: string;
    danger: string;
  };
  spacing: (n: number) => number;
  /** Minimum tap target; the logging screen uses larger ones. */
  minTouch: number;
}

/** Font family names, as registered by useFonts in App.tsx. */
export const fonts = {
  logo: 'ChangaOne_400Regular',
  regular: 'NotoSans_400Regular',
  semibold: 'NotoSans_600SemiBold',
  bold: 'NotoSans_700Bold',
} as const;

/**
 * Android ignores fontWeight for custom fonts, so each weight is its own family.
 * Maps a fontWeight to the matching Noto Sans family.
 */
export function fontFamilyFor(weight: string | number | undefined): string {
  const w = Number(weight === 'bold' ? 700 : (weight ?? 400));
  if (w >= 700) return fonts.bold;
  if (w >= 600) return fonts.semibold;
  return fonts.regular;
}

const spacing = (n: number) => n * 4;

const brand = {
  red: '#F61C24',
  teal: '#41D2EF',
  black: '#03020C',
  navy: '#1D2180',
  /** Buttons and containers. */
  navyDark: '#11135A',
};

export const darkTheme: Theme = {
  dark: true,
  colors: {
    background: '#0C0E17',
    surface: brand.navyDark,
    text: '#FFFFFF',
    textMuted: '#B4B7E0',
    primary: brand.red,
    onPrimary: '#FFFFFF',
    accent: brand.teal,
    onAccent: brand.black,
    border: 'transparent',
    subtle: '#2A2E6E',
    danger: '#FF6B70',
  },
  spacing,
  minTouch: 48,
};

/** Strongr has one look for now: the night theme. */
export function useTheme(): Theme {
  return darkTheme;
}
