import { useState } from 'react';
import { View } from 'react-native';

import { formatLongDate, parseDateKey } from '@/core/dates';
import { useTranslation } from '@/core/i18n';
import { formatNumber, toDisplayWeight, type WeightUnit } from '@/core/units';
import { AppText, Button, ModalCard, TextField } from '@/ui';

/** A positive weight, 0 for "remove" (empty or zero), or null when invalid. */
function parse(text: string): number | null {
  if (!text.trim()) return 0;
  const value = Number(text.trim().replace(',', '.'));
  return Number.isFinite(value) && value >= 0 ? value : null;
}

interface Props {
  /** Monday of the week being edited, YYYY-MM-DD; null hides the dialog. */
  weekStart: string | null;
  currentKg: number | null;
  unit: WeightUnit;
  /** Receives the value in the user's display unit. */
  onSave(value: number): void;
  /** Called when the field is saved empty or as 0. */
  onRemove(): void;
  onCancel(): void;
}

/** Enter or change the bodyweight for one week. */
export function BodyweightDialog(props: Props) {
  const { weekStart, currentKg, unit, onSave, onRemove, onCancel } = props;
  const { t, i18n } = useTranslation();
  const [text, setText] = useState('');
  const initial = currentKg === null ? '' : formatNumber(toDisplayWeight(currentKg, unit), 1);
  const value = parse(text);
  const removing = value === 0;
  // Saving empty or 0 removes an existing entry; with no entry there is nothing to save.
  const canSave = value !== null && (value > 0 || currentKg !== null);
  const submit = () => {
    if (!canSave) return;
    if (removing) onRemove();
    else onSave(value);
  };

  return (
    <ModalCard
      visible={weekStart !== null}
      title={t('history.bodyweightTitle')}
      message={
        weekStart
          ? [
              t('history.weekOf', { date: formatLongDate(parseDateKey(weekStart), i18n.language) }),
              currentKg !== null ? t('history.bodyweightRemoveHint') : null,
            ]
              .filter(Boolean)
              .join('\n')
          : undefined
      }
      onRequestClose={onCancel}
      hasInput
      onShow={() => setText(initial)}
    >
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <TextField
          value={text}
          onChangeText={setText}
          keyboardType="decimal-pad"
          autoFocus
          selectTextOnFocus
          placeholder={unit}
          accessibilityLabel={t('history.bodyweightTitle')}
          inset
          style={{ flex: 1 }}
          onSubmitEditing={submit}
        />
        <AppText variant="muted">{unit}</AppText>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Button label={t('common.cancel')} variant="quiet" onPress={onCancel} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label={removing && currentKg !== null ? t('common.delete') : t('common.save')}
            onPress={submit}
            disabled={!canSave}
          />
        </View>
      </View>
    </ModalCard>
  );
}
