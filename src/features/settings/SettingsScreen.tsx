import { View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { useSettings } from '@/core/settings';
import type { WeightUnit } from '@/core/units';
import { AppText, Screen, SegmentedControl } from '@/ui';

export function SettingsScreen() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();

  return (
    <Screen>
      <View style={{ gap: 8 }}>
        <AppText variant="label">{t('settings.weightUnit')}</AppText>
        <SegmentedControl<WeightUnit>
          accessibilityLabel={t('settings.weightUnit')}
          value={settings.weightUnit}
          onChange={(weightUnit) => void updateSettings({ weightUnit })}
          options={[
            { value: 'kg', label: 'kg' },
            { value: 'lb', label: 'lb' },
          ]}
        />
      </View>
    </Screen>
  );
}
