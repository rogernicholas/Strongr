import { View } from 'react-native';

import { useTheme } from '@/core/theme';

/** Shows which page of a swipeable pager is visible. */
export function PageDots({ count, active }: { count: number; active: number }) {
  const theme = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 10 }}
    >
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            width: i === active ? 20 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === active ? theme.colors.accent : theme.colors.border,
          }}
        />
      ))}
    </View>
  );
}
