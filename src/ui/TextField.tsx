import { TextInput, type TextInputProps } from 'react-native';

import { fonts, useTheme } from '@/core/theme';

/** `inset` is for fields placed on a navy card or dialog: they take the dark page colour. */
export function TextField({ style, inset, ...rest }: TextInputProps & { inset?: boolean }) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.colors.textMuted}
      {...rest}
      style={[
        {
          minHeight: theme.buttonHeight,
          borderWidth: 1,
          borderRadius: theme.radius.md,
          paddingHorizontal: 12,
          fontSize: 16,
          fontFamily: fonts.regular,
          color: theme.colors.text,
          borderColor: theme.colors.border,
          backgroundColor: inset ? theme.colors.background : theme.colors.surface,
        },
        style,
      ]}
    />
  );
}
