import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_LANGUAGE } from '@/config/defaults';

import en from './locales/en.json';

export const resources = { en: { translation: en } } as const;

const i18n = createInstance();

// initImmediate is false because resources are bundled, so strings are ready on first render.
void i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false },
  initAsync: false,
});

export { useTranslation } from 'react-i18next';
export default i18n;
