import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/core/theme';

interface Props {
  children: ReactNode;
  /** Pad for the status bar too; for pages shown without a header. */
  top?: boolean;
}

export function Screen({ children, top = false }: Props) {
  const theme = useTheme();
  const edges: Edge[] = top ? ['top', 'bottom', 'left', 'right'] : ['bottom', 'left', 'right'];
  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        // A tap on a button acts at once instead of only closing the keyboard.
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: theme.spacing(4), gap: theme.spacing(3) }}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
