import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from './Button';
import { ModalCard } from './ModalCard';

interface DialogOptions {
  title: string;
  message?: string;
  /** Label of the main button; also the only button when cancelLabel is omitted. */
  confirmLabel: string;
  cancelLabel?: string;
  /** Red main button, for deleting. */
  destructive?: boolean;
}

type Show = (options: DialogOptions) => Promise<boolean>;

const DialogContext = createContext<Show | null>(null);

/** Hosts the app's themed dialog, replacing the white native Alert. */
export function DialogProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<DialogOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const show = useCallback<Show>(
    (next) =>
      new Promise<boolean>((resolve) => {
        resolver.current?.(false);
        resolver.current = resolve;
        setOptions(next);
      }),
    [],
  );

  const close = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOptions(null);
  };

  return (
    <DialogContext.Provider value={show}>
      {children}
      <ModalCard
        visible={options !== null}
        title={options?.title ?? ''}
        message={options?.message}
        onRequestClose={() => close(false)}
      >
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {options?.cancelLabel ? (
            <View style={{ flex: 1 }}>
              <Button label={options.cancelLabel} variant="quiet" onPress={() => close(false)} />
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <Button
              label={options?.confirmLabel ?? ''}
              variant={options?.destructive || !options?.cancelLabel ? 'primary' : 'accent'}
              onPress={() => close(true)}
            />
          </View>
        </View>
      </ModalCard>
    </DialogContext.Provider>
  );
}

/** Resolves true when the main button is pressed, false on cancel or Back. */
export function useDialog(): Show {
  const show = useContext(DialogContext);
  if (!show) throw new Error('useDialog must be used inside DialogProvider');
  return show;
}
