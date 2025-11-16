import enTranslations from '../i18n/en.json';
import ptTranslations from '../i18n/pt.json';
import type { Language } from './types';

type TranslationKey = keyof typeof enTranslations;

const translations = {
  EN: enTranslations,
  PT: ptTranslations,
};

export function t(key: string, lang: Language = 'EN', variables?: Record<string, string>): string {
  const translation = getNestedValue(translations[lang], key) || getNestedValue(translations.EN, key) || key;
  
  if (!variables) {
    return translation;
  }

  return translation.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return variables[varName] || match;
  });
}

function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

export { translations };
export type { TranslationKey };
