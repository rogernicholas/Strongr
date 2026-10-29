import { useCallback } from 'react';

import { formatSetShort, type SetValues } from './format';
import { useTranslation } from './i18n';
import { useSettings } from './settings';

/** formatSetShort in the user's unit, with translated rep counts ("20 kg × 15 reps"). */
export function useFormatSet(): (set: SetValues) => string {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const unit = settings.weightUnit;
  return useCallback(
    (set: SetValues) => formatSetShort(set, unit, (count) => t('common.repCount', { count })),
    [t, unit],
  );
}
