import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { formatClock } from '@/core/format';
import { useTranslation } from '@/core/i18n';
import { useTheme } from '@/core/theme';
import { AppText } from '@/ui';

interface Props {
  /** When the set being rested after was logged (epoch ms). */
  since: number;
  onLog(seconds: number): void;
}

/** After this long the phone was probably put away; the timer hides itself. */
const MAX_SECONDS = 60 * 60;

/** Counts up from the last logged set. Log rest saves the time for stats. */
export function RestTimer({ since, onLog }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const seconds = Math.max(0, (now - since) / 1000);
  if (seconds > MAX_SECONDS) return null;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}>
      <AppText variant="label">{t('logging.rest').toUpperCase()}</AppText>
      <AppText
        variant="stat"
        style={{ flex: 1, color: theme.colors.accent, fontVariant: ['tabular-nums'] }}
      >
        {formatClock(seconds)}
      </AppText>
      <Pressable
        accessibilityRole="button"
        onPress={() => onLog(seconds)}
        hitSlop={8}
        style={({ pressed }) => ({
          minHeight: 40,
          paddingHorizontal: 16,
          borderRadius: theme.radius.pill,
          justifyContent: 'center',
          backgroundColor: pressed ? theme.colors.raised : theme.colors.background,
        })}
      >
        <AppText style={{ color: theme.colors.accent, fontWeight: '600' }}>
          {t('logging.logRest')}
        </AppText>
      </Pressable>
    </View>
  );
}
