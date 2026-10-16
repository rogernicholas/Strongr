import { TextInput, type TextInputProps } from 'react-native';

import { fonts, useTheme } from '@/core/theme';

export function TextField({ style, ...rest }: TextInputProps) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.colors.textMuted}
      {...rest}
      style={[
        {
          minHeight: theme.minTouch,
          borderWidth: 1,
          borderRadius: 12,
          paddingHorizontal: 12,
          fontSize: 16,
          fontFamily: fonts.regular,
          color: theme.colors.text,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        },
        style,
      ]}
    />
  );
}
