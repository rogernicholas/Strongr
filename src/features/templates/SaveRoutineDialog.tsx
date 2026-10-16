import { useState } from 'react';
import { View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { Button, ModalCard, TextField } from '@/ui';

interface Props {
  visible: boolean;
  initialName: string;
  onSave(name: string): void;
  onCancel(): void;
}

export function SaveRoutineDialog({ visible, initialName, onSave, onCancel }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);

  return (
    <ModalCard
      visible={visible}
      title={t('routines.saveTitle')}
      onRequestClose={onCancel}
      onShow={() => setName(initialName)}
    >
      <TextField
        value={name}
        onChangeText={setName}
        placeholder={t('routines.namePlaceholder')}
        autoFocus
        selectTextOnFocus
        inset
        onSubmitEditing={() => name.trim() && onSave(name)}
      />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Button label={t('common.cancel')} variant="quiet" onPress={onCancel} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label={t('common.save')} onPress={() => onSave(name)} disabled={!name.trim()} />
        </View>
      </View>
    </ModalCard>
  );
}
