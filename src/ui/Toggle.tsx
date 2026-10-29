import { Pressable, View } from 'react-native';

import { useTheme } from '@/core/theme';

import { AppText } from './AppText';

interface Props {
  label: string;
  /** Optional second line under the label. */
  hint?: string;
  value: boolean;
  onChange(value: boolean): void;
}

/** A tappable row with a checkbox: settings switches and the warm-up flag. */
export function Toggle({ label, hint, value, onChange }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: value ? theme.colors.accent : theme.colors.subtle,
          backgroundColor: value ? theme.colors.accent : 'transparent',
        }}
      />
      <View style={{ flex: 1 }}>
        <AppText>{label}</AppText>
        {hint ? <AppText variant="muted">{hint}</AppText> : null}
      </View>
    </Pressable>
  );
}
