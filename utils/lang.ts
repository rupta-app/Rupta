/** Normalize the i18n language to the two supported app locales. */
export function appLang(i18n: { language: string }): 'es' | 'en' {
  return i18n.language.startsWith('es') ? 'es' : 'en';
}
