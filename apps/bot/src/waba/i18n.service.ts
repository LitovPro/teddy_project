import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Language } from '@teddy/shared';
import * as enTranslations from '@teddy/shared/i18n/en.json';
import * as ptTranslations from '@teddy/shared/i18n/pt.json';

@Injectable()
export class I18nService {
  private readonly translations = {
    EN: enTranslations,
    PT: ptTranslations,
  };

  constructor(private configService: ConfigService) {}

  // Получить переведенный текст
  t(key: string, language: Language, variables: Record<string, string> = {}): string {
    const translation = this.getNestedTranslation(this.translations[language], key);
    
    if (!translation) {
      // Fallback на английский
      const fallback = this.getNestedTranslation(this.translations.EN, key);
      if (!fallback) {
        return `[Missing translation: ${key}]`;
      }
      return this.interpolate(fallback, variables);
    }

    return this.interpolate(translation, variables);
  }

  // Получить вложенный перевод по ключу (например, "menu.loyalty")
  private getNestedTranslation(translations: any, key: string): string | null {
    const keys = key.split('.');
    let current = translations;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return null;
      }
    }

    return typeof current === 'string' ? current : null;
  }

  // Заменить переменные в тексте ({{variable}})
  private interpolate(text: string, variables: Record<string, string>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  // Получить все переводы для языка (для отладки)
  getTranslations(language: Language): any {
    return this.translations[language];
  }

  // Проверить, существует ли перевод
  hasTranslation(key: string, language: Language): boolean {
    return this.getNestedTranslation(this.translations[language], key) !== null;
  }

  // Получить конфигурацию брендинга
  getBrandConfig() {
    return {
      name: this.configService.get('BRAND_NAME', 'Teddy & Friends'),
      gmaps: this.configService.get('BRAND_GMAPS', 'https://maps.app.goo.gl/example'),
      instagram: this.configService.get('BRAND_INSTAGRAM', 'https://instagram.com/teddy_and_friends'),
    };
  }
}
