import { Pressable, TextInput, View } from 'react-native';

import { fonts, useTheme } from '@/core/theme';

import { AppText } from './AppText';

interface Props {
  label: string;
  value: string;
  onChangeText(text: string): void;
  step: number;
  decimals?: boolean;
}

function bump(text: string, delta: number): string {
  const current = Number(text.replace(',', '.'));
  const next = Math.max(0, (Number.isFinite(current) ? current : 0) + delta);
  return String(Math.round(next * 100) / 100);
}

/** One row: label, then −, a wide numeric field and +. The field gets most of the width. */
export function NumberStepper({ label, value, onChangeText, step, decimals = false }: Props) {
  const theme = useTheme();
  const button = (sign: -1 | 1) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${sign < 0 ? '−' : '+'}${step} ${label}`}
      onPress={() => onChangeText(bump(value, sign * step))}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <AppText style={{ fontSize: 22, color: theme.colors.accent }}>{sign < 0 ? '−' : '+'}</AppText>
    </Pressable>
  );

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <AppText variant="label" style={{ width: 52 }}>
        {label.toUpperCase()}
      </AppText>
      {button(-1)}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={decimals ? 'decimal-pad' : 'number-pad'}
        selectTextOnFocus
        accessibilityLabel={label}
        style={{
          flex: 1,
          height: 52,
          paddingVertical: 0,
          paddingHorizontal: 4,
          textAlign: 'center',
          fontSize: 26,
          fontFamily: fonts.bold,
          borderBottomWidth: 2,
          color: theme.colors.text,
          borderColor: theme.colors.subtle,
        }}
      />
      {button(1)}
    </View>
  );
}
