import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { useTheme } from '@/core/theme';
import { AppText, Button, TextField } from '@/ui';

interface Props {
  visible: boolean;
  initialName: string;
  onSave(name: string): void;
  onCancel(): void;
}

export function SaveRoutineDialog({ visible, initialName, onSave, onCancel }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [name, setName] = useState(initialName);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      onShow={() => setName(initialName)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{
          flex: 1,
          justifyContent: 'center',
          padding: 24,
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}
      >
        <View
          style={{ gap: 12, padding: 20, borderRadius: 16, backgroundColor: theme.colors.surface }}
        >
          <AppText style={{ fontSize: 18, fontWeight: '600' }}>{t('routines.saveTitle')}</AppText>
          <TextField
            value={name}
            onChangeText={setName}
            placeholder={t('routines.namePlaceholder')}
            autoFocus
            selectTextOnFocus
            onSubmitEditing={() => name.trim() && onSave(name)}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Button label={t('common.cancel')} variant="secondary" onPress={onCancel} />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={t('common.save')}
                onPress={() => onSave(name)}
                disabled={!name.trim()}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
