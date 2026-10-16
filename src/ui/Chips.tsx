import { Pressable, View } from 'react-native';

import { useTheme } from '@/core/theme';

import { AppText } from './AppText';

interface Props<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange(value: T): void;
}

/** Wrapping single-choice chips, for when a segmented control would be too cramped. */
export function Chips<T extends string>({ options, value, onChange }: Props<T>) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={{
              minHeight: 40,
              paddingHorizontal: 14,
              borderRadius: 20,
              borderWidth: 1,
              justifyContent: 'center',
              borderColor: selected ? theme.colors.accent : theme.colors.border,
              backgroundColor: selected ? theme.colors.accent : theme.colors.surface,
            }}
          >
            <AppText style={{ color: selected ? theme.colors.onAccent : theme.colors.text }}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
