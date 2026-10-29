import { View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { AppText, Card, SegmentedControl } from '@/ui';

import type { Range } from './stats';

export const DASH = '–';

/** Half-width card with a label and a big value; `wide` takes the full row. */
export function StatTile({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <View style={{ width: wide ? '100%' : '48.5%' }}>
      <Card>
        <AppText variant="label">{label.toUpperCase()}</AppText>
        <AppText variant="stat">{value}</AppText>
      </Card>
    </View>
  );
}

export function RangeControl({ value, onChange }: { value: Range; onChange(range: Range): void }) {
  const { t } = useTranslation();
  return (
    <SegmentedControl<Range>
      accessibilityLabel={t('stats.range')}
      value={value}
      onChange={onChange}
      options={[
        { value: '3m', label: t('stats.range3m') },
        { value: '1y', label: t('stats.range1y') },
        { value: 'all', label: t('stats.rangeAll') },
      ]}
    />
  );
}
