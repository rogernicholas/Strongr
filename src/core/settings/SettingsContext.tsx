import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Settings } from '@/config/defaults';

interface SettingsContextValue {
  settings: Settings;
  updateSettings(patch: Partial<Settings>): Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

interface Props {
  initial: Settings;
  /** Persists the full settings object. Injected by the app shell. */
  save(settings: Settings): Promise<void>;
  children: ReactNode;
}

export function SettingsProvider({ initial, save, children }: Props) {
  const [settings, setSettings] = useState(initial);

  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      await save(next);
    },
    [settings, save],
  );

  const value = useMemo(() => ({ settings, updateSettings }), [settings, updateSettings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useSettings must be used inside SettingsProvider');
  return value;
}
