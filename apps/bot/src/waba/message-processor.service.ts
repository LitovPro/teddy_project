import { Injectable, Logger } from '@nestjs/common';
import type { WhatsAppMessage, Language } from '@teddy/shared';
import { FamiliesService } from '../families/families.service';
import { ConversationService } from './conversation.service';
import { UtilityMessagesService } from './utility-messages.service';
import { 
  ConversationState, 
  MenuCommand, 
  SubscriptionAction,
  MessageProcessingResult,
  InteractiveButton
} from './conversation.types';

@Injectable()
export class MessageProcessorService {
  private readonly logger = new Logger(MessageProcessorService.name);

  constructor(
    private conversationService: ConversationService,
    private familiesService: FamiliesService,
    private utilityMessages: UtilityMessagesService,
  ) {}

  async processMessage(message: WhatsAppMessage): Promise<MessageProcessingResult> {
    const { from: waId, type } = message;
    
    this.logger.log(`Processing ${type} message from ${waId}`);

    // Получаем контекст разговора
    const context = this.conversationService.getOrCreateContext(waId);

    try {
      // Обрабатываем в зависимости от типа сообщения
      if (type === 'text' && message.text) {
        return await this.handleTextMessage(waId, message.text.body, context);
      } else if (type === 'interactive' && message.interactive) {
        return await this.handleInteractiveMessage(waId, message.interactive, context);
      }

      // Неизвестный тип сообщения
      return {
        handled: false,
        response: {
          type: 'text',
          content: 'Sorry, I don\'t understand this type of message.'
        }
      };

    } catch (error) {
      this.logger.error(`Error processing message from ${waId}:`, error);
      return {
        handled: false,
        response: {
          type: 'text',
          content: 'Sorry, something went wrong. Please try again.'
        }
      };
    }
  }

  private async handleTextMessage(waId: string, text: string, context: any): Promise<MessageProcessingResult> {
    const normalizedText = text.toLowerCase().trim();

    switch (context.state) {
      case ConversationState.NEW:
        return await this.handleNewUser(waId, context);

      case ConversationState.LANGUAGE_SELECTION:
        return await this.handleLanguageSelection(waId, normalizedText, context);

      case ConversationState.ONBOARDED:
      case ConversationState.MAIN_MENU:
        return await this.handleMainMenuCommand(waId, normalizedText, context);

      default:
        return await this.handleUnknownState(waId, context);
    }
  }

  private async handleInteractiveMessage(waId: string, interactive: any, context: any): Promise<MessageProcessingResult> {
    const buttonId = interactive.button_reply?.id || interactive.list_reply?.id;

    if (!buttonId) {
      return { handled: false };
    }

    this.logger.log(`Interactive button pressed: ${buttonId}`);

    // Обработка языковых кнопок
    if (buttonId === 'lang_en' || buttonId === 'lang_pt') {
      const language: Language = buttonId === 'lang_pt' ? 'PT' : 'EN';
      return await this.handleLanguageSelected(waId, language, context);
    }

    // Обработка кнопок подписки
    if (buttonId === SubscriptionAction.SUBSCRIBE_YES || buttonId === SubscriptionAction.SUBSCRIBE_NO) {
      return await this.handleSubscriptionChoice(waId, buttonId, context);
    }

    // Обработка команд меню
    if (Object.values(MenuCommand).includes(buttonId as MenuCommand)) {
      return await this.handleMenuCommand(waId, buttonId as MenuCommand, context);
    }

    return { handled: false };
  }

  private async handleNewUser(waId: string, context: any): Promise<MessageProcessingResult> {
    // Проверяем, есть ли уже семья с таким waId
    const existingFamily = await this.familiesService.findByWaId(waId);

    if (existingFamily) {
      // Пользователь уже существует, переводим в главное меню
      this.conversationService.updateContext(waId, {
        state: ConversationState.ONBOARDED,
        familyId: existingFamily.id,
        language: existingFamily.lang as Language,
      });

      const welcomeBackMessage = await this.utilityMessages.createWelcomeBackMessage(
        existingFamily.clientCode,
        existingFamily.lang as Language
      );

      return {
        handled: true,
        newState: ConversationState.ONBOARDED,
        response: {
          type: welcomeBackMessage.type,
          content: welcomeBackMessage.text || welcomeBackMessage
        }
      };
    }

    // Новый пользователь - предлагаем выбрать язык
    this.conversationService.setState(waId, ConversationState.LANGUAGE_SELECTION);

    const buttons: InteractiveButton[] = [
      { id: 'lang_en', title: 'English' },
      { id: 'lang_pt', title: 'Português' }
    ];

    return {
      handled: true,
      newState: ConversationState.LANGUAGE_SELECTION,
      response: {
        type: 'interactive',
        content: {
          type: 'button',
          body: {
            text: 'Please choose your language / Por favor escolha o seu idioma'
          },
          action: {
            buttons: buttons.map(btn => ({
              type: 'reply',
              reply: btn
            }))
          }
        }
      }
    };
  }

  private async handleLanguageSelection(waId: string, text: string, _context: any): Promise<MessageProcessingResult> {
    // Пользователь может написать текстом вместо нажатия кнопки
    let language: Language = 'EN';
    
    if (text.includes('pt') || text.includes('português') || text.includes('portugues')) {
      language = 'PT';
    }

    return await this.handleLanguageSelected(waId, language, _context);
  }

  private async handleLanguageSelected(waId: string, language: Language, context: any): Promise<MessageProcessingResult> {
    // Создаем новую семью
    const family = await this.familiesService.create({
      waId,
      lang: language,
      consentMarketing: false,
    });

    // Обновляем контекст
    this.conversationService.updateContext(waId, {
      state: ConversationState.ONBOARDED,
      language,
      familyId: family.id,
    });

    const welcomeMessage = await this.utilityMessages.createWelcomeMessage(
      family.clientCode,
      language
    );

    return {
      handled: true,
      newState: ConversationState.ONBOARDED,
      response: {
        type: welcomeMessage.type,
        content: welcomeMessage.text || welcomeMessage
      },
      actions: [
        {
          type: 'create_family',
          payload: { familyId: family.id }
        }
      ]
    };
  }

  private async handleMainMenuCommand(waId: string, text: string, context: any): Promise<MessageProcessingResult> {
    // Определяем команду по тексту
    const command = this.parseMenuCommand(text, context.language);
    
    if (command) {
      return await this.handleMenuCommand(waId, command, context);
    }

    // Неизвестная команда - показываем главное меню
    const mainMenuMessage = await this.utilityMessages.createMainMenuMessage(context.language);
    
    return {
      handled: true,
      response: {
        type: mainMenuMessage.type,
        content: mainMenuMessage
      }
    };
  }

  private async handleMenuCommand(waId: string, command: MenuCommand, context: any): Promise<MessageProcessingResult> {

    switch (command) {
      case MenuCommand.LOYALTY:
        return await this.handleLoyaltyCommand(waId, context);

      case MenuCommand.MENU:
        return await this.handleMenuCommand_Menu(waId, context);

      case MenuCommand.HOURS:
        return await this.handleHoursCommand(waId, context);

      case MenuCommand.EVENTS:
        return await this.handleEventsCommand(waId, context);

      case MenuCommand.RULES:
        return await this.handleRulesCommand(waId, context);

      case MenuCommand.PROFILE:
        return await this.handleProfileCommand(waId, context);

      case MenuCommand.UNSUBSCRIBE:
        return await this.handleUnsubscribeCommand(waId, context);

      default:
        return { handled: false };
    }
  }

  private async handleSubscriptionChoice(waId: string, choice: string, _context: any): Promise<MessageProcessingResult> {
    const isSubscribing = choice === SubscriptionAction.SUBSCRIBE_YES;

    // TODO: Обновить подписки в базе данных
    
    const message = isSubscribing 
      ? (_context.language === 'PT' ? 'Obrigado! Você receberá atualizações sobre eventos e ofertas especiais.' : 'Thank you! You\'ll receive updates about events and special offers.')
      : (_context.language === 'PT' ? 'Tudo bem! Você pode se inscrever a qualquer momento no menu.' : 'No problem! You can subscribe anytime from the menu.');

    return {
      handled: true,
      response: {
        type: 'text',
        content: message
      }
    };
  }

  private async handleUnknownState(waId: string, context: any): Promise<MessageProcessingResult> {
    // Сбрасываем в главное меню
    this.conversationService.setState(waId, ConversationState.MAIN_MENU);

    const mainMenuMessage = await this.utilityMessages.createMainMenuMessage(context.language);

    return {
      handled: true,
      newState: ConversationState.MAIN_MENU,
      response: {
        type: mainMenuMessage.type,
        content: mainMenuMessage
      }
    };
  }

  // Вспомогательные методы для команд меню
  private async handleLoyaltyCommand(waId: string, context: any): Promise<MessageProcessingResult> {
    // TODO: Получить прогресс лояльности и отправить карту
    const progressMessage = await this.utilityMessages.createLoyaltyProgressMessage(3, 5, context.language);
    
    return {
      handled: true,
      response: {
        type: progressMessage.type,
        content: progressMessage.text || progressMessage
      }
    };
  }

  private async handleMenuCommand_Menu(waId: string, context: any): Promise<MessageProcessingResult> {
    const menuMessage = await this.utilityMessages.createMenuMessage(context.language);
    
    return {
      handled: true,
      response: {
        type: menuMessage.type,
        content: menuMessage.text || menuMessage
      }
    };
  }

  private async handleHoursCommand(waId: string, context: any): Promise<MessageProcessingResult> {
    const hoursMessage = await this.utilityMessages.createHoursMessage(context.language);
    
    return {
      handled: true,
      response: {
        type: hoursMessage.type,
        content: hoursMessage.text || hoursMessage
      }
    };
  }

  private async handleEventsCommand(waId: string, context: any): Promise<MessageProcessingResult> {
    const eventsMessage = await this.utilityMessages.createEventsMessage(context.language);
    
    return {
      handled: true,
      response: {
        type: eventsMessage.type,
        content: eventsMessage.text || eventsMessage
      }
    };
  }

  private async handleRulesCommand(waId: string, context: any): Promise<MessageProcessingResult> {
    const rulesMessage = await this.utilityMessages.createRulesMessage(context.language);
    
    return {
      handled: true,
      response: {
        type: rulesMessage.type,
        content: rulesMessage.text || rulesMessage
      }
    };
  }

  private async handleProfileCommand(waId: string, context: any): Promise<MessageProcessingResult> {
    // Получаем семью для отображения профиля
    const family = context.familyId ? await this.familiesService.findById(context.familyId) : null;
    const clientCode = family?.clientCode || 'Unknown';
    
    const profileMessage = await this.utilityMessages.createProfileMessage(clientCode, context.language);
    
    return {
      handled: true,
      response: {
        type: profileMessage.type,
        content: profileMessage.text || profileMessage
      }
    };
  }

  private async handleUnsubscribeCommand(waId: string, context: any): Promise<MessageProcessingResult> {
    const unsubscribeMessage = await this.utilityMessages.createUnsubscribeConfirmation(context.language);
    
    return {
      handled: true,
      response: {
        type: unsubscribeMessage.type,
        content: unsubscribeMessage.text || unsubscribeMessage
      }
    };
  }

  // Вспомогательные методы
  private parseMenuCommand(text: string, language: Language): MenuCommand | null {
    const normalizedText = text.toLowerCase();

    // Английские команды
    if (language === 'EN') {
      if (normalizedText.includes('loyalty') || normalizedText.includes('card')) return MenuCommand.LOYALTY;
      if (normalizedText.includes('menu') || normalizedText.includes('food')) return MenuCommand.MENU;
      if (normalizedText.includes('hours') || normalizedText.includes('time')) return MenuCommand.HOURS;
      if (normalizedText.includes('events') || normalizedText.includes('event')) return MenuCommand.EVENTS;
      if (normalizedText.includes('rules') || normalizedText.includes('rule')) return MenuCommand.RULES;
      if (normalizedText.includes('profile') || normalizedText.includes('account')) return MenuCommand.PROFILE;
      if (normalizedText.includes('unsubscribe') || normalizedText.includes('stop')) return MenuCommand.UNSUBSCRIBE;
    }

    // Португальские команды
    if (language === 'PT') {
      if (normalizedText.includes('fidelidade') || normalizedText.includes('cartão')) return MenuCommand.LOYALTY;
      if (normalizedText.includes('menu') || normalizedText.includes('comida')) return MenuCommand.MENU;
      if (normalizedText.includes('horário') || normalizedText.includes('hora')) return MenuCommand.HOURS;
      if (normalizedText.includes('eventos') || normalizedText.includes('evento')) return MenuCommand.EVENTS;
      if (normalizedText.includes('regras') || normalizedText.includes('regra')) return MenuCommand.RULES;
      if (normalizedText.includes('perfil') || normalizedText.includes('conta')) return MenuCommand.PROFILE;
      if (normalizedText.includes('cancelar') || normalizedText.includes('parar')) return MenuCommand.UNSUBSCRIBE;
    }

    return null;
  }


}
