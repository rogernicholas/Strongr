import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, View } from 'react-native';

import { formatLongDate, parseDateKey } from '@/core/dates';
import { useTranslation } from '@/core/i18n';
import { useTheme } from '@/core/theme';
import { formatNumber, toDisplayWeight, type WeightUnit } from '@/core/units';
import { AppText, Button, TextField } from '@/ui';

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
  const theme = useTheme();
  const [text, setText] = useState('');
  const initial = currentKg === null ? '' : formatNumber(toDisplayWeight(currentKg, unit), 1);
  const value = parse(text);

  return (
    <Modal
      visible={weekStart !== null}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      onShow={() => setText(initial)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{
          flex: 1,
          justifyContent: 'center',
          padding: 24,
          backgroundColor: 'rgba(0,0,0,0.6)',
        }}
      >
        <View
          style={{ gap: 12, padding: 20, borderRadius: 16, backgroundColor: theme.colors.surface }}
        >
          <AppText style={{ fontSize: 18, fontWeight: '600' }}>
            {t('history.bodyweightTitle')}
          </AppText>
          {weekStart ? (
            <AppText variant="muted">
              {t('history.weekOf', {
                date: formatLongDate(parseDateKey(weekStart), i18n.language),
              })}
            </AppText>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TextField
              value={text}
              onChangeText={setText}
              keyboardType="decimal-pad"
              autoFocus
              selectTextOnFocus
              placeholder={unit}
              accessibilityLabel={t('history.bodyweightTitle')}
              style={{ flex: 1 }}
              onSubmitEditing={() => value !== null && onSave(value)}
            />
            <AppText>{unit}</AppText>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Button label={t('common.cancel')} variant="secondary" onPress={onCancel} />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={t('common.save')}
                onPress={() => value !== null && onSave(value)}
                disabled={value === null}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
