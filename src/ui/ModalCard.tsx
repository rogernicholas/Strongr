import type { ReactNode } from 'react';
import { Modal, View } from 'react-native';

import { useTheme } from '@/core/theme';

import { AppText } from './AppText';

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  onRequestClose(): void;
  onShow?(): void;
  /**
   * Dialogs with a text field sit in the upper part of the screen, where the
   * keyboard never reaches, so nothing has to move when it opens or closes.
   */
  hasInput?: boolean;
  children?: ReactNode;
}

/** Themed popup card over a dark backdrop; shared by every dialog in the app. */
export function ModalCard({
  visible,
  title,
  message,
  onRequestClose,
  onShow,
  hasInput = false,
  children,
}: Props) {
  const theme = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onRequestClose}
      onShow={onShow}
    >
      <View
        style={{
          flex: 1,
          justifyContent: hasInput ? 'flex-start' : 'center',
          padding: theme.spacing(6),
          paddingTop: hasInput ? '18%' : theme.spacing(6),
          backgroundColor: theme.colors.backdrop,
        }}
      >
        <View
          accessibilityViewIsModal
          style={{
            gap: theme.spacing(4),
            padding: theme.spacing(5),
            borderRadius: theme.radius.lg,
            backgroundColor: theme.colors.surface,
          }}
        >
          <View style={{ gap: theme.spacing(2) }}>
            <AppText accessibilityRole="header" variant="heading">
              {title}
            </AppText>
            {message ? <AppText variant="muted">{message}</AppText> : null}
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}
