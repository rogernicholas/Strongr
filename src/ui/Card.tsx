import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/core/theme';

interface Props {
  children: ReactNode;
  onPress?(): void;
  onLongPress?(): void;
  accessibilityLabel?: string;
}

export function Card({ children, onPress, onLongPress, accessibilityLabel }: Props) {
  const theme = useTheme();
  const style = {
    padding: theme.spacing(4),
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: 4,
  };
  if (!onPress && !onLongPress) return <View style={style}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [style, { opacity: pressed ? 0.7 : 1 }]}
    >
      {children}
    </Pressable>
  );
}
