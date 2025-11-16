import { Injectable, Logger } from '@nestjs/common';
import type { Language } from '@teddy/shared';
import { I18nService } from './i18n.service';
import { InteractiveButton, MessageTemplate } from './conversation.types';

@Injectable()
export class UtilityMessagesService {
  private readonly logger = new Logger(UtilityMessagesService.name);

  constructor(private i18n: I18nService) {}

  // Welcome сообщение для нового пользователя
  async createWelcomeMessage(clientCode: string, language: Language): Promise<MessageTemplate> {
    const welcomeText = this.i18n.t('onboarding.welcome', language);
    const customerNumberText = this.i18n.t('onboarding.customer_number', language, { clientCode });
    const menuHintText = this.i18n.t('onboarding.menu_hint', language);

    return {
      type: 'text',
      text: `${welcomeText}\n\n${customerNumberText}\n\n${menuHintText}`
    };
  }

  // Welcome back сообщение для существующего пользователя
  async createWelcomeBackMessage(clientCode: string, language: Language): Promise<MessageTemplate> {
    const greeting = this.i18n.t('greeting', language);
    const customerNumber = this.i18n.t('onboarding.customer_number', language, { clientCode });

    return {
      type: 'text',
      text: `${greeting}\n\n${customerNumber}`
    };
  }

  // Главное меню с кнопками
  async createMainMenuMessage(language: Language): Promise<MessageTemplate> {
    const buttons: InteractiveButton[] = [
      {
        id: 'loyalty',
        title: this.i18n.t('menu.loyalty', language)
      },
      {
        id: 'menu',
        title: this.i18n.t('menu.cafe', language)
      },
      {
        id: 'hours',
        title: this.i18n.t('menu.hours', language)
      }
    ];

    return {
      type: 'interactive',
      buttons,
      text: language === 'PT' ? 'O que gostaria de fazer?' : 'What would you like to do?'
    };
  }

  // Сообщение о прогрессе лояльности
  async createLoyaltyProgressMessage(
    current: number, 
    target: number, 
    language: Language,
    cardImageUrl?: string
  ): Promise<MessageTemplate> {
    const progressText = this.i18n.t('loyalty.progress', language, {
      current: current.toString(),
      target: target.toString()
    });

    if (cardImageUrl) {
      return {
        type: 'image',
        imageUrl: cardImageUrl,
        caption: progressText
      };
    }

    return {
      type: 'text',
      text: progressText
    };
  }

  // Сообщение о выданном ваучере
  async createVoucherIssuedMessage(
    voucherCode: string,
    language: Language,
    voucherImageUrl?: string
  ): Promise<MessageTemplate> {
    const completedText = this.i18n.t('loyalty.completed', language);
    const voucherReadyText = this.i18n.t('loyalty.voucher_ready', language);

    const message = `${completedText}\n\n${voucherReadyText}`;

    if (voucherImageUrl) {
      return {
        type: 'image',
        imageUrl: voucherImageUrl,
        caption: `${message}\n\n🎫 ${voucherCode}`
      };
    }

    return {
      type: 'text',
      text: `${message}\n\n🎫 ${voucherCode}`
    };
  }

  // Check-out сообщение с ссылками
  async createCheckoutMessage(language: Language): Promise<MessageTemplate> {
    const brandConfig = this.i18n.getBrandConfig();
    
    const checkoutText = this.i18n.t('checkout.message', language, {
      gmapsUrl: brandConfig.gmaps,
      instagramUrl: brandConfig.instagram
    });

    return {
      type: 'text',
      text: checkoutText
    };
  }

  // Предложение подписки
  async createSubscriptionPrompt(language: Language): Promise<MessageTemplate> {
    const promptText = this.i18n.t('subscribe.prompt', language);
    
    const buttons: InteractiveButton[] = [
      {
        id: 'subscribe_yes',
        title: this.i18n.t('subscribe.ok', language)
      },
      {
        id: 'subscribe_no', 
        title: this.i18n.t('subscribe.no', language)
      }
    ];

    return {
      type: 'interactive',
      text: promptText,
      buttons
    };
  }

  // Подтверждение отписки
  async createUnsubscribeConfirmation(language: Language): Promise<MessageTemplate> {
    const unsubscribeText = this.i18n.t('unsubscribe.done', language);

    return {
      type: 'text',
      text: unsubscribeText
    };
  }

  // Сообщение с меню кафе
  async createMenuMessage(language: Language): Promise<MessageTemplate> {
    // TODO: Интегрировать с MenuService для получения актуального меню
    const menuText = language === 'PT' 
      ? '☕ Nosso delicioso menu estará disponível em breve!'
      : '☕ Our delicious menu will be available soon!';

    return {
      type: 'text',
      text: menuText
    };
  }

  // Часы работы
  async createHoursMessage(language: Language): Promise<MessageTemplate> {
    const hoursText = language === 'PT'
      ? '🕐 Horários de Funcionamento:\nSegunda-Domingo: 9:00-18:00\n\n📍 Venha nos visitar!'
      : '🕐 Opening Hours:\nMonday-Sunday: 9:00-18:00\n\n📍 Come visit us!';

    return {
      type: 'text',
      text: hoursText
    };
  }

  // События
  async createEventsMessage(language: Language): Promise<MessageTemplate> {
    const eventsText = language === 'PT'
      ? '🎉 Eventos Especiais:\n\nEm breve teremos workshops incríveis para as crianças!\n\n📅 Fique atento às novidades!'
      : '🎉 Special Events:\n\nSoon we\'ll have amazing workshops for kids!\n\n📅 Stay tuned for updates!';

    return {
      type: 'text',
      text: eventsText
    };
  }

  // Правила
  async createRulesMessage(language: Language): Promise<MessageTemplate> {
    const rulesText = language === 'PT'
      ? '📋 Regras do Parque:\n\n• Supervisão dos pais obrigatória\n• Máximo 2 horas por sessão\n• Meias obrigatórias\n• Idade recomendada: 1-12 anos\n• Mantenha a área limpa\n\n🤝 Obrigado pela compreensão!'
      : '📋 Playground Rules:\n\n• Parental supervision required\n• Maximum 2 hours per session\n• Socks required\n• Recommended age: 1-12 years\n• Keep the area clean\n\n🤝 Thank you for understanding!';

    return {
      type: 'text',
      text: rulesText
    };
  }

  // Профиль пользователя
  async createProfileMessage(clientCode: string, language: Language): Promise<MessageTemplate> {
    // TODO: Интегрировать с FamiliesService для получения данных профиля
    const profileText = language === 'PT'
      ? `👤 Seu Perfil:\n\n🆔 Código do Cliente: ${clientCode}\n\n📊 Dados completos do perfil em breve!`
      : `👤 Your Profile:\n\n🆔 Customer Code: ${clientCode}\n\n📊 Complete profile data coming soon!`;

    return {
      type: 'text',
      text: profileText
    };
  }

  // Сообщение об ошибке
  async createErrorMessage(language: Language): Promise<MessageTemplate> {
    const errorText = language === 'PT'
      ? '❌ Ops! Algo deu errado. Tente novamente em alguns minutos ou contacte nossa equipe.'
      : '❌ Oops! Something went wrong. Please try again in a few minutes or contact our staff.';

    return {
      type: 'text',
      text: errorText
    };
  }

  // Сообщение о неизвестной команде
  async createUnknownCommandMessage(language: Language): Promise<MessageTemplate> {
    const unknownText = language === 'PT'
      ? '🤔 Não entendi sua mensagem. Vou mostrar o menu principal:'
      : '🤔 I didn\'t understand your message. Let me show you the main menu:';

    return {
      type: 'text',
      text: unknownText
    };
  }
}
