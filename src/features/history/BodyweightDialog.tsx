import { useState } from 'react';
import { View } from 'react-native';

import { formatLongDate, parseDateKey } from '@/core/dates';
import { useTranslation } from '@/core/i18n';
import { formatNumber, toDisplayWeight, type WeightUnit } from '@/core/units';
import { AppText, Button, ModalCard, TextField } from '@/ui';

function parse(text: string): number | null {
  const value = Number(text.trim().replace(',', '.'));
  return text.trim() && Number.isFinite(value) && value > 0 ? value : null;
}

interface Props {
  /** Monday of the week being edited, YYYY-MM-DD; null hides the dialog. */
  weekStart: string | null;
  currentKg: number | null;
  unit: WeightUnit;
  /** Receives the value in the user's display unit. */
  onSave(value: number): void;
  onCancel(): void;
}

/** Enter or change the bodyweight for one week. */
export function BodyweightDialog({ weekStart, currentKg, unit, onSave, onCancel }: Props) {
  const { t, i18n } = useTranslation();
  const [text, setText] = useState('');
  const initial = currentKg === null ? '' : formatNumber(toDisplayWeight(currentKg, unit), 1);
  const value = parse(text);

  return (
    <ModalCard
      visible={weekStart !== null}
      title={t('history.bodyweightTitle')}
      message={
        weekStart
          ? t('history.weekOf', { date: formatLongDate(parseDateKey(weekStart), i18n.language) })
          : undefined
      }
      onRequestClose={onCancel}
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
          onSubmitEditing={() => value !== null && onSave(value)}
        />
        <AppText variant="muted">{unit}</AppText>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Button label={t('common.cancel')} variant="quiet" onPress={onCancel} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label={t('common.save')}
            onPress={() => value !== null && onSave(value)}
            disabled={value === null}
          />
        </View>
      </View>
    </ModalCard>
  );
}
