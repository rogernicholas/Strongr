import { useState } from 'react';
import { View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { SUGGEST_REPS_RANGE, useSettings } from '@/core/settings';
import type { WeightUnit } from '@/core/units';
import { AppText, NumberStepper, Screen, SegmentedControl, Toggle } from '@/ui';

export function SettingsScreen() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const [repsText, setRepsText] = useState(String(settings.suggestAtReps));

  // Saves only whole numbers in range; the field may hold anything while typing.
  function changeReps(text: string) {
    setRepsText(text);
    const value = Number(text);
    const { min, max } = SUGGEST_REPS_RANGE;
    if (Number.isInteger(value) && value >= min && value <= max && text.trim() !== '') {
      void updateSettings({ suggestAtReps: value });
    }
  }

  return (
    <Screen>
      <View style={{ gap: 8 }}>
        <AppText variant="label">{t('settings.weightUnit').toUpperCase()}</AppText>
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

      <View style={{ gap: 4 }}>
        <AppText variant="label">{t('settings.workout').toUpperCase()}</AppText>
        <Toggle
          label={t('settings.restTimer')}
          hint={t('settings.restTimerHint')}
          value={settings.showRestTimer}
          onChange={(showRestTimer) => void updateSettings({ showRestTimer })}
        />
        <Toggle
          label={t('settings.suggestions')}
          hint={t('settings.suggestionsHint')}
          value={settings.weightSuggestions}
          onChange={(weightSuggestions) => void updateSettings({ weightSuggestions })}
        />
        {settings.weightSuggestions ? (
          <View style={{ gap: 8, paddingTop: 8 }}>
            <AppText variant="muted">{t('settings.suggestAt')}</AppText>
            <NumberStepper
              label={t('logging.reps')}
              value={repsText}
              onChangeText={changeReps}
              step={1}
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
