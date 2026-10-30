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

/** A tappable row with an on/off switch: settings and the warm-up flag. */
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
      <View style={{ flex: 1 }}>
        <AppText>{label}</AppText>
        {hint ? <AppText variant="muted">{hint}</AppText> : null}
      </View>
      <View
        style={{
          width: 48,
          height: 28,
          padding: 3,
          borderRadius: 14,
          alignItems: value ? 'flex-end' : 'flex-start',
          backgroundColor: value ? theme.colors.accent : theme.colors.subtle,
        }}
      >
        <View
          style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: theme.colors.text }}
        />
      </View>
    </Pressable>
  );
}
