import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Language } from '@teddy/shared';
import { 
  ConversationContext, 
  ConversationState
} from './conversation.types';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);
  private readonly contexts = new Map<string, ConversationContext>();
  
  constructor(private configService: ConfigService) {}

  // Получить или создать контекст разговора
  getOrCreateContext(waId: string, language: Language = 'EN'): ConversationContext {
    let context = this.contexts.get(waId);
    
    if (!context) {
      context = {
        waId,
        state: ConversationState.NEW,
        language,
        lastMessageTime: new Date(),
      };
      this.contexts.set(waId, context);
      this.logger.log(`Created new conversation context for ${waId}`);
    } else {
      context.lastMessageTime = new Date();
    }
    
    return context;
  }

  // Обновить контекст
  updateContext(waId: string, updates: Partial<ConversationContext>): void {
    const context = this.contexts.get(waId);
    if (context) {
      Object.assign(context, updates);
      this.logger.log(`Updated context for ${waId}:`, updates);
    }
  }

  // Установить состояние
  setState(waId: string, state: ConversationState): void {
    this.updateContext(waId, { state });
  }

  // Установить язык
  setLanguage(waId: string, language: Language): void {
    this.updateContext(waId, { language });
  }

  // Связать с семьей
  linkFamily(waId: string, familyId: string): void {
    this.updateContext(waId, { familyId });
  }

  // Очистить контекст (для тестирования или сброса)
  clearContext(waId: string): void {
    this.contexts.delete(waId);
    this.logger.log(`Cleared context for ${waId}`);
  }

  // Получить все активные контексты (для статистики)
  getActiveContextsCount(): number {
    return this.contexts.size;
  }

  // Очистка старых контекстов (можно вызывать по cron)
  cleanupOldContexts(maxAgeHours: number = 24): number {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    let cleaned = 0;

    for (const [waId, context] of this.contexts.entries()) {
      if (context.lastMessageTime < cutoffTime) {
        this.contexts.delete(waId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} old conversation contexts`);
    }

    return cleaned;
  }

  // Проверить, является ли пользователь новым
  isNewUser(waId: string): boolean {
    const context = this.contexts.get(waId);
    return !context || context.state === ConversationState.NEW;
  }

  // Проверить, нужно ли показать главное меню
  shouldShowMainMenu(waId: string): boolean {
    const context = this.contexts.get(waId);
    return context?.state === ConversationState.ONBOARDED || 
           context?.state === ConversationState.MAIN_MENU;
  }
}
