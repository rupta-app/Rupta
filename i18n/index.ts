import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en } from '@/i18n/en';
import { es } from '@/i18n/es';

const resources = {
  en: { translation: en },
  es: { translation: es },
} as const;

export const supportedLanguages = ['en', 'es'] as const;
export type AppLanguage = (typeof supportedLanguages)[number];

const fallbackLng: AppLanguage = 'en';

function detectLanguage(): AppLanguage {
  const tag = Localization.getLocales()[0]?.languageCode ?? 'en';
  return tag.startsWith('es') ? 'es' : 'en';
}

void i18n.use(initReactI18next).init({
  resources,
  lng: detectLanguage(),
  fallbackLng,
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export { i18n };

export function setAppLanguage(lng: AppLanguage) {
  void i18n.changeLanguage(lng);
}
