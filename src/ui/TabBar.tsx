import { Pressable, View } from 'react-native';

import { useTheme } from '@/core/theme';

import { AppText } from './AppText';

interface Props {
  labels: readonly string[];
  active: number;
  onSelect(index: number): void;
}

/** Labelled tabs along the bottom; the active one is teal with a bar above it. */
export function TabBar({ labels, active, onSelect }: Props) {
  const theme = useTheme();
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row' }}>
      {labels.map((label, i) => {
        const selected = i === active;
        return (
          <Pressable
            key={label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onSelect(i)}
            style={{ flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center' }}
          >
            <View
              style={{
                position: 'absolute',
                top: 0,
                width: 32,
                height: 3,
                borderRadius: 2,
                backgroundColor: selected ? theme.colors.accent : 'transparent',
              }}
            />
            <AppText
              style={{
                fontWeight: '600',
                color: selected ? theme.colors.accent : theme.colors.textMuted,
              }}
            >
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
