import type { Language } from '@teddy/shared';

// Состояния разговора
export enum ConversationState {
  NEW = 'new',
  LANGUAGE_SELECTION = 'language_selection',
  ONBOARDED = 'onboarded',
  MAIN_MENU = 'main_menu',
  SUBSCRIBE_PROMPT = 'subscribe_prompt',
  CHECKOUT = 'checkout',
}

// Команды меню
export enum MenuCommand {
  LOYALTY = 'loyalty',
  MENU = 'menu',
  HOURS = 'hours',
  EVENTS = 'events',
  RULES = 'rules',
  PROFILE = 'profile',
  UNSUBSCRIBE = 'unsubscribe',
}

// Кнопки подписки
export enum SubscriptionAction {
  SUBSCRIBE_YES = 'subscribe_yes',
  SUBSCRIBE_NO = 'subscribe_no',
  UNSUBSCRIBE = 'unsubscribe',
}

// Контекст разговора
export interface ConversationContext {
  waId: string;
  familyId?: string;
  state: ConversationState;
  language: Language;
  lastMessageTime: Date;
  pendingAction?: string;
  metadata?: Record<string, any>;
}

// Результат обработки сообщения
export interface MessageProcessingResult {
  handled: boolean;
  newState?: ConversationState;
  response?: {
    type: 'text' | 'template' | 'image' | 'interactive';
    content: any;
  };
  actions?: Array<{
    type: 'create_family' | 'update_context' | 'log_interaction';
    payload: any;
  }>;
}

// Интерактивные элементы
export interface InteractiveButton {
  id: string;
  title: string;
}

export interface InteractiveList {
  button: string;
  sections: Array<{
    title: string;
    rows: Array<{
      id: string;
      title: string;
      description?: string;
    }>;
  }>;
}

// Шаблоны сообщений
export interface MessageTemplate {
  type: 'text' | 'interactive' | 'image';
  text?: string;
  buttons?: InteractiveButton[];
  list?: InteractiveList;
  imageUrl?: string;
  caption?: string;
}
