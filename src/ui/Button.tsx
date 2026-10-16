import { Pressable } from 'react-native';

import { useTheme } from '@/core/theme';

import { AppText } from './AppText';

interface Props {
  label: string;
  onPress(): void;
  /**
   * primary: red main action. secondary: navy. accent: teal.
   * quiet: dark, for Cancel inside a navy dialog or card.
   */
  variant?: 'primary' | 'secondary' | 'accent' | 'quiet';
  disabled?: boolean;
}

export function Button({ label, onPress, variant = 'primary', disabled }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const look = {
    primary: { bg: colors.primary, fg: colors.onPrimary },
    secondary: { bg: colors.surface, fg: colors.text },
    accent: { bg: colors.accent, fg: colors.onAccent },
    quiet: { bg: colors.background, fg: colors.textMuted },
  }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: theme.buttonHeight,
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing(4),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: look.bg,
        opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
      })}
    >
      <AppText style={{ color: look.fg, fontWeight: '600' }}>{label}</AppText>
    </Pressable>
  );
}
