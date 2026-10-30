import { Pressable, View } from 'react-native';

import { useTheme } from '@/core/theme';

interface Props {
  /** Read out by screen readers; nothing is shown on screen. */
  labels: readonly string[];
  active: number;
  onSelect(index: number): void;
}

/** Unlabelled tabs along the bottom; a teal bar marks the active one. */
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
            style={{ flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <View
              style={{
                width: 32,
                height: 3,
                borderRadius: 2,
                backgroundColor: selected ? theme.colors.accent : 'transparent',
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
