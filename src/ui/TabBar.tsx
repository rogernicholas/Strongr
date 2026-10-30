import { Pressable, View } from 'react-native';

import { useTheme } from '@/core/theme';

interface Props {
  /** Read out by screen readers; not shown. */
  labels: readonly string[];
  active: number;
  onSelect(index: number): void;
}

/** One short bar per page along the bottom; the active one is teal. */
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
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            onPress={() => onSelect(i)}
            style={{
              flex: 1,
              minHeight: theme.minTouch,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 32,
                height: 4,
                borderRadius: 2,
                backgroundColor: selected ? theme.colors.accent : theme.colors.subtle,
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
