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

/** Big −/+ buttons around a numeric field, sized for mid-workout thumbs. */
export function NumberStepper({ label, value, onChangeText, step, decimals = false }: Props) {
  const theme = useTheme();
  const button = (sign: -1 | 1) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${sign < 0 ? '−' : '+'}${step} ${label}`}
      onPress={() => onChangeText(bump(value, sign * step))}
      style={({ pressed }) => ({
        width: 56,
        height: 56,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <AppText style={{ fontSize: 26, fontWeight: '600' }}>{sign < 0 ? '−' : '+'}</AppText>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, gap: 4 }}>
      <AppText variant="label" style={{ textAlign: 'center' }}>
        {label}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {button(-1)}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={decimals ? 'decimal-pad' : 'number-pad'}
          selectTextOnFocus
          accessibilityLabel={label}
          style={{
            flex: 1,
            height: 56,
            textAlign: 'center',
            fontSize: 24,
            fontFamily: fonts.bold,
            borderRadius: 14,
            borderWidth: 1,
            color: theme.colors.text,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
          }}
        />
        {button(1)}
      </View>
    </View>
  );
}
