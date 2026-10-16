import { useState } from 'react';

import { formatLongDate, localDateKey } from '@/core/dates';
import { useDb } from '@/core/db';
import { useTranslation } from '@/core/i18n';
import { track } from '@/core/services';
import { useSettings } from '@/core/settings';
import { createBodyweightRepository, createWorkoutRepository } from '@/data';
import { LinkButton, useDialog } from '@/ui';

import { buildTxtExport } from './buildTxtExport';
import { shareTextFile } from './exportTxt';

export function ExportButton() {
  const { t, i18n } = useTranslation();
  const db = useDb();
  const dialog = useDialog();
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
        void dialog({
          title: t('backup.nothingTitle'),
          message: t('backup.nothingBody'),
          confirmLabel: t('common.ok'),
        });
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
      void dialog({ title: t('backup.failed'), confirmLabel: t('common.ok') });
    } finally {
      setBusy(false);
    }
  }

  return (
    <LinkButton label={t('backup.exportTxt')} disabled={busy} onPress={() => void exportAll()} />
  );
}
