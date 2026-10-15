import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useTranslation } from '@/core/i18n';
import { AppText, Button, Screen } from '@/ui';

import type { RootStackParamList } from './navigation';

export function HomeScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Home'>) {
  const { t } = useTranslation();
  return (
    <Screen>
      <AppText variant="title">{t('home.title')}</AppText>
      <AppText variant="muted">{t('home.comingSoon')}</AppText>
      <Button label={t('home.settings')} onPress={() => navigation.navigate('Settings')} />
      <Button
        label={t('home.about')}
        variant="secondary"
        onPress={() => navigation.navigate('About')}
      />
    </Screen>
  );
}
