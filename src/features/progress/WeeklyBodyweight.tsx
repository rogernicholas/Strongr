import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { weekStartKey } from '@/core/dates';
import { useDb } from '@/core/db';
import { useTranslation } from '@/core/i18n';
import { useSettings } from '@/core/settings';
import { formatNumber, fromDisplayWeight, toDisplayWeight } from '@/core/units';
import { createBodyweightRepository } from '@/data';
import { AppText, Button, Card, TextField } from '@/ui';

function parse(text: string): number | null {
  const value = Number(text.trim().replace(',', '.'));
  return text.trim() && Number.isFinite(value) && value > 0 ? value : null;
}

/** One bodyweight entry per week (Monday to Sunday). */
export function WeeklyBodyweight() {
  const { t } = useTranslation();
  const db = useDb();
  const { settings } = useSettings();
  const unit = settings.weightUnit;
  const week = weekStartKey(new Date());
  const [savedKg, setSavedKg] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    let active = true;
    void createBodyweightRepository(db)
      .get(week)
      .then((b) => active && setSavedKg(b?.weightKg ?? null));
    return () => {
      active = false;
    };
  }, [db, week]);

  async function save() {
    const value = parse(text);
    if (value === null) return;
    const kg = fromDisplayWeight(value, unit);
    await createBodyweightRepository(db).set(week, kg);
    setSavedKg(kg);
    setEditing(false);
  }

  if (editing) {
    return (
      <Card>
        <AppText variant="label">{t('progress.bodyweightThisWeek')}</AppText>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TextField
            value={text}
            onChangeText={setText}
            keyboardType="decimal-pad"
            autoFocus
            selectTextOnFocus
            placeholder={unit}
            style={{ flex: 1 }}
            onSubmitEditing={() => void save()}
          />
          <AppText>{unit}</AppText>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <View style={{ flex: 1 }}>
            <Button
              label={t('common.cancel')}
              variant="secondary"
              onPress={() => setEditing(false)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t('common.save')}
              onPress={() => void save()}
              disabled={parse(text) === null}
            />
          </View>
        </View>
      </Card>
    );
  }

  const shown = savedKg === null ? null : formatNumber(toDisplayWeight(savedKg, unit), 1);
  return (
    <Card
      accessibilityLabel={t('progress.bodyweightThisWeek')}
      onPress={() => {
        setText(shown ?? '');
        setEditing(true);
      }}
    >
      <AppText variant="label">{t('progress.bodyweightThisWeek')}</AppText>
      <AppText style={{ fontSize: 18, fontWeight: '600' }}>
        {shown === null ? t('progress.bodyweightAdd') : `${shown} ${unit}`}
      </AppText>
    </Card>
  );
}
