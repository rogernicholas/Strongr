import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useDb } from '@/core/db';
import { useTranslation } from '@/core/i18n';
import { createMetaRepository } from '@/data';
import { AppText, Screen } from '@/ui';

export function AboutScreen() {
  const { t } = useTranslation();
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
