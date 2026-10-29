export interface Theme {
  dark: boolean;
  colors: {
    background: string;
    /** Navy for buttons, cards and fields. */
    surface: string;
    /** Lighter navy for pressed and raised surfaces. */
    raised: string;
    text: string;
    textMuted: string;
    /** Main actions (red). */
    primary: string;
    onPrimary: string;
    /** Dim red for disabled main actions. */
    primaryDim: string;
    /** Highlights: today, selection, dots, graph lines (teal). */
    accent: string;
    onAccent: string;
    /** Dim teal for disabled and subtle highlights. */
    accentDim: string;
    /** Borders are off in the night theme (transparent). */
    border: string;
    /** Faint lines that must stay visible: chart grid, page dots, empty checkboxes. */
    subtle: string;
    danger: string;
    /** Dims the screen behind dialogs. */
    backdrop: string;
  };
  spacing: (n: number) => number;
  /** Corner radii: sm for small cells, md for buttons, cards and fields, lg for dialogs. */
  radius: { sm: number; md: number; lg: number; pill: number };
  /** Height of every standard button. */
  buttonHeight: number;
  /** Minimum tap target; the logging screen uses larger ones. */
  minTouch: number;
}

/** Font family names, as registered by useFonts in App.tsx. */
export const fonts = {
  logo: 'ChangaOne_400Regular',
  regular: 'InstrumentSans_400Regular',
  semibold: 'InstrumentSans_600SemiBold',
  bold: 'InstrumentSans_700Bold',
} as const;

/**
 * Android ignores fontWeight for custom fonts, so each weight is its own family.
 * Maps a fontWeight to the matching Instrument Sans family.
 */
export function fontFamilyFor(weight: string | number | undefined): string {
  const w = Number(weight === 'bold' ? 700 : (weight ?? 400));
  if (w >= 700) return fonts.bold;
  if (w >= 600) return fonts.semibold;
  return fonts.regular;
}

const spacing = (n: number) => n * 4;

/**
 * One blue hue (238°) runs through the background, surfaces, muted text and
 * lines, so the page reads as a deep version of the navy. Red and teal are
 * tuned to sit closer in lightness so neither shouts.
 */
const palette = {
  ink: '#0C0C1D',
  navy: '#11135A',
  navyRaised: '#1F226B',
  line: '#2E317A',
  mist: '#ABAED9',
  white: '#F3F3FC',
  red: '#EB424B',
  redDim: '#793437',
  redSoft: '#F76E75',
  teal: '#2AB1CF',
  tealDim: '#2E606B',
  onTeal: '#080921',
};

export const darkTheme: Theme = {
  dark: true,
  colors: {
    background: palette.ink,
    surface: palette.navy,
    raised: palette.navyRaised,
    text: palette.white,
    textMuted: palette.mist,
    primary: palette.red,
    onPrimary: palette.white,
    primaryDim: palette.redDim,
    accent: palette.teal,
    onAccent: palette.onTeal,
    accentDim: palette.tealDim,
    border: 'transparent',
    subtle: palette.line,
    danger: palette.redSoft,
    backdrop: 'rgba(12, 12, 29, 0.82)',
  },
  spacing,
  radius: { sm: 10, md: 14, lg: 22, pill: 999 },
  buttonHeight: 52,
  minTouch: 48,
};

/** Strongr has one look for now: the night theme. */
export function useTheme(): Theme {
  return darkTheme;
}
