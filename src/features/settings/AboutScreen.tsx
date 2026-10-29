import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { formatShortDate } from '@/core/dates';
import { useDb } from '@/core/db';
import { useTranslation } from '@/core/i18n';
import { createMetaRepository } from '@/data';
import { AppText, Screen } from '@/ui';

export function AboutScreen() {
  const { t, i18n } = useTranslation();
  const db = useDb();
  const [schemaVersion, setSchemaVersion] = useState<number | null>(null);

  useEffect(() => {
    void createMetaRepository(db).schemaVersion().then(setSchemaVersion);
  }, [db]);

  return (
    <Screen>
      <AppText variant="title">{t('app.name')}</AppText>
      <Row label={t('about.version')} value={Constants.expoConfig?.version ?? '?'} />
      <Row label={t('about.schemaVersion')} value={schemaVersion?.toString() ?? '…'} />
      <Row
        label={t('about.update')}
        value={
          Updates.isEmbeddedLaunch || !Updates.createdAt
            ? t('about.builtIn')
            : formatShortDate(Updates.createdAt, i18n.language)
        }
      />
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <AppText variant="muted">{label}</AppText>
      <AppText>{value}</AppText>
    </View>
  );
}
