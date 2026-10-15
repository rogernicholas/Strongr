import { View } from 'react-native';

import type { ThemePreference } from '@/config/defaults';
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
      <View style={{ gap: 8 }}>
        <AppText variant="label">{t('settings.theme')}</AppText>
        <SegmentedControl<ThemePreference>
          accessibilityLabel={t('settings.theme')}
          value={settings.theme}
          onChange={(theme) => void updateSettings({ theme })}
          options={[
            { value: 'system', label: t('settings.themeSystem') },
            { value: 'light', label: t('settings.themeLight') },
            { value: 'dark', label: t('settings.themeDark') },
          ]}
        />
      </View>
    </Screen>
  );
}
