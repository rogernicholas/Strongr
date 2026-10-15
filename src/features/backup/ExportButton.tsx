import { useState } from 'react';
import { Alert } from 'react-native';

import { formatLongDate, localDateKey } from '@/core/dates';
import { useDb } from '@/core/db';
import { useTranslation } from '@/core/i18n';
import { track } from '@/core/services';
import { useSettings } from '@/core/settings';
import { createBodyweightRepository, createWorkoutRepository } from '@/data';
import { Button } from '@/ui';

import { buildTxtExport } from './buildTxtExport';
import { shareTextFile } from './exportTxt';

export function ExportButton() {
  const { t, i18n } = useTranslation();
  const db = useDb();
  const { settings } = useSettings();
  const [busy, setBusy] = useState(false);

  async function exportAll() {
    setBusy(true);
    try {
      const [workouts, bodyweights] = await Promise.all([
        createWorkoutRepository(db).listFinished(),
        createBodyweightRepository(db).list(),
      ]);
      if (workouts.length === 0) {
        Alert.alert(t('backup.nothingTitle'), t('backup.nothingBody'));
        return;
      }
      const unit = settings.weightUnit;
      const text = buildTxtExport(workouts, bodyweights, {
        unit,
        formatDay: (d) => formatLongDate(d, i18n.language),
        labels: {
          header: t('backup.header', { date: localDateKey(new Date()), unit }),
          bodyweight: t('backup.bodyweight'),
          warmupNote: t('backup.warmupNote'),
        },
      });
      await shareTextFile(`strongr-${localDateKey(new Date())}.txt`, text, t('backup.exportTxt'));
      track('export_txt', { workouts: workouts.length });
    } catch {
      Alert.alert(t('backup.failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      label={t('backup.exportTxt')}
      variant="secondary"
      disabled={busy}
      onPress={() => void exportAll()}
    />
  );
}
