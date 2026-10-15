import { Text, type TextProps } from 'react-native';

import { useTheme } from '@/core/theme';

type Variant = 'title' | 'body' | 'muted' | 'label';

const sizes: Record<Variant, { fontSize: number; fontWeight: '400' | '600' | '700' }> = {
  title: { fontSize: 28, fontWeight: '700' },
  body: { fontSize: 16, fontWeight: '400' },
  muted: { fontSize: 14, fontWeight: '400' },
  label: { fontSize: 13, fontWeight: '600' },
};

export function AppText({ variant = 'body', style, ...rest }: TextProps & { variant?: Variant }) {
  const theme = useTheme();
  const color =
    variant === 'muted' || variant === 'label' ? theme.colors.textMuted : theme.colors.text;
  return <Text {...rest} style={[sizes[variant], { color }, style]} />;
}
