import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { fontFamilyFor, fonts, useTheme } from '@/core/theme';

type Variant = 'logo' | 'title' | 'heading' | 'stat' | 'body' | 'muted' | 'label';

const sizes: Record<Variant, { fontSize: number; fontWeight: '400' | '600' | '700' }> = {
  logo: { fontSize: 56, fontWeight: '400' },
  title: { fontSize: 28, fontWeight: '700' },
  /** Card and dialog titles. */
  heading: { fontSize: 18, fontWeight: '600' },
  /** Big numbers in stat tiles. */
  stat: { fontSize: 22, fontWeight: '700' },
  body: { fontSize: 16, fontWeight: '400' },
  muted: { fontSize: 14, fontWeight: '400' },
  label: { fontSize: 12, fontWeight: '600' },
};

export function AppText({ variant = 'body', style, ...rest }: TextProps & { variant?: Variant }) {
  const theme = useTheme();
  const color =
    variant === 'muted' || variant === 'label' ? theme.colors.textMuted : theme.colors.text;
  const { fontWeight, fontFamily, ...flat }: TextStyle =
    StyleSheet.flatten([sizes[variant], { color }, style]) ?? {};
  const family =
    fontFamily ?? (variant === 'logo' ? fonts.logo : fontFamilyFor(fontWeight ?? undefined));
  return <Text {...rest} style={{ ...flat, fontFamily: family }} />;
}
