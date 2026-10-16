import { useEffect, useState, type ReactNode } from 'react';
import { Keyboard, Modal, View } from 'react-native';

import { useTheme } from '@/core/theme';

import { AppText } from './AppText';

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  onRequestClose(): void;
  onShow?(): void;
  children?: ReactNode;
}

/** Themed popup card over a dark backdrop; shared by every dialog in the app. */
export function ModalCard({ visible, title, message, onRequestClose, onShow, children }: Props) {
  const theme = useTheme();
  // Modals don't resize for the keyboard on Android, so lift the card above it ourselves.
  const [keyboard, setKeyboard] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) =>
      setKeyboard(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboard(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

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
          justifyContent: 'center',
          padding: theme.spacing(6),
          paddingBottom: theme.spacing(6) + keyboard,
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
