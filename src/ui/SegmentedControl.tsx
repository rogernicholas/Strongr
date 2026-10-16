import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme';

import { AppText } from './AppText';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: readonly Option<T>[];
  value: T;
  onChange(value: T): void;
  accessibilityLabel: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: Props<T>) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[styles.row, { borderRadius: theme.radius.md }]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.item,
              {
                minHeight: theme.buttonHeight,
                backgroundColor: selected ? theme.colors.accent : theme.colors.surface,
              },
            ]}
          >
            <AppText
              style={{
                color: selected ? theme.colors.onAccent : theme.colors.text,
                fontWeight: '600',
              }}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', overflow: 'hidden' },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
