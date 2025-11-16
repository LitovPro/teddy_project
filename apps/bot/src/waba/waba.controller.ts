import { Body, Controller, Get, Post, Query, Logger, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { WabaService } from './waba.service';
import { TwilioService } from '../twilio/twilio.service';
import { OnboardingService } from '../onboarding/onboarding.service';
import { VisitsService } from '../visits/visits.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { I18nService } from '../i18n/i18n.service';
// NOTE: Payment/Orders functionality is currently disabled but kept for future use
// DO NOT DELETE - This service may be needed in the future for online payment integration
// import { OrdersService } from '../orders/orders.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { BookingsService } from '../events/bookings.service';
import type { WhatsAppWebhook } from '@teddy/shared';

@Controller('webhooks/whatsapp')
export class WabaController {
  private readonly logger = new Logger(WabaController.name);

  constructor(
    private wabaService: WabaService,
    private twilioService: TwilioService,
    private onboardingService: OnboardingService,
    private visitsService: VisitsService,
    private loyaltyService: LoyaltyService,
    private i18nService: I18nService,
    // NOTE: OrdersService disabled - payment functionality not needed currently
    // DO NOT DELETE - May be needed in the future for online payment integration
    // private ordersService: OrdersService,
    private subscriptionsService: SubscriptionsService,
    private prisma: PrismaService,
    private eventsService: EventsService,
    private bookingsService: BookingsService,
  ) { }

  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    this.logger.log(`Webhook verification: mode=${mode}, token=${token}`);

    if (mode === 'subscribe' && this.wabaService.verifyWebhook(token)) {
      this.logger.log('Webhook verified successfully');
      return challenge;
    }

    this.logger.error('Webhook verification failed');
    return 'Forbidden';
  }

  @Post()
  async handleWebhook(
    @Body() webhook: any,
    @Headers('x-hub-signature-256') signature?: string,
  ) {
    this.logger.log('Received webhook:', JSON.stringify(webhook, null, 2));

    // Handle simple message format (for testing)
    if (webhook.From && webhook.Body) {
      this.logger.log(`Simple message from ${webhook.From}: ${webhook.Body}`);

      // Process the message and send response
      await this.processSimpleMessage(webhook.From, webhook.Body);

      return { success: true, message: 'Simple message processed' };
    }

    // Handle Facebook/Meta webhook format
    if (webhook.entry && Array.isArray(webhook.entry)) {
      // Verify signature if provided
      if (signature) {
        const payload = JSON.stringify(webhook);
        const isValid = this.wabaService.verifySignature(payload, signature);

        if (!isValid) {
          this.logger.error('Invalid webhook signature');
          throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
        }
      } else {
        this.logger.warn('No signature provided in webhook request');
      }

      try {
        // Process webhook events
        for (const entry of webhook.entry) {
          for (const change of entry.changes) {
            if (change.value.messages) {
              for (const message of change.value.messages) {
                await this.processMessage(message, change.value.metadata.phone_number_id);
              }
            }

            if (change.value.statuses) {
              for (const status of change.value.statuses) {
                this.logger.log(`Message status update: ${status.id} -> ${status.status}`);
              }
            }
          }
        }

        return { success: true };
      } catch (error) {
        this.logger.error('Error processing webhook:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    return { success: false, error: 'Invalid webhook format' };
  }

  private async processMessage(message: any, phoneNumberId: string) {
    this.logger.log(`Processing message from ${message.from}: ${message.type}`);

    // Используем новый метод WabaService для обработки сообщений
    await this.wabaService.processMessage(message, phoneNumberId);
  }

  private async processSimpleMessage(from: string, body: string) {
    this.logger.log(`Processing simple message from ${from}: ${body}`);

    // Remove whatsapp: prefix if present
    const phoneNumber = from.replace('whatsapp:', '');
    const message = body.toLowerCase().trim();

    try {
      // Если это первое сообщение "START T&F"
      if (message === 'start t&f' || message === 'start t&f' || message === 'start teddy' || message === 'start') {
        await this.onboardingService.handleStartMessage(phoneNumber, from);
        return;
      }

      // Проверяем статус онбординга
      const onboardingStatus = await this.onboardingService.getOnboardingStatus(phoneNumber);

      // Если онбординг не завершен
      if (!onboardingStatus || onboardingStatus === 'pending') {
        // Проверяем, не является ли это выбором языка
        if (message === 'en' || message === 'english') {
          await this.onboardingService.handleLanguageSelection(phoneNumber, 'EN');
        } else if (message === 'pt' || message === 'português' || message === 'portugues') {
          await this.onboardingService.handleLanguageSelection(phoneNumber, 'PT');
        } else {
          await this.sendResponse(phoneNumber, this.i18nService.getTranslation('welcome', 'EN') + '\n\n' + this.i18nService.getTranslation('choose_language', 'EN'));
        }
        return;
      }

      // Получаем информацию о семье
      const familyInfo = await this.onboardingService.getFamilyInfo(phoneNumber);
      if (!familyInfo) {
        await this.sendResponse(phoneNumber, this.i18nService.getTranslation('family_not_found', 'EN'));
        return;
      }

      const language = familyInfo.preferredLanguage as 'EN' | 'PT';

      // Обрабатываем команды
      if (message === 'hi' || message === 'hello' || message === 'привет' || message === 'olá' || message === 'ola') {
        const welcomeMessage = this.i18nService.getTranslationWithParams('welcome_with_code', { clientCode: familyInfo.clientCode }, language);
        await this.sendResponse(phoneNumber, welcomeMessage);
      } else if (message === 'menu' || message === 'café menu' || message === 'cafe menu') {
        await this.sendMenuMessage(phoneNumber, language);
      } else if (message === 'loyalty' || message === 'fidelidade') {
        await this.sendLoyaltyMessage(phoneNumber, familyInfo.id, language);
      } else if (message === 'help' || message === 'ajuda') {
        await this.sendHelpMessage(phoneNumber, language);
      } else if (message === 'book' || message === 'reservar' || message === 'booking') {
        await this.sendBookingMessage(phoneNumber, familyInfo.id, language);
      } else if (message === 'contact' || message === 'contacto') {
        await this.sendContactMessage(phoneNumber, language);
      } else if (message === 'profile' || message === 'perfil' || message === 'my profile' || message === 'meu perfil') {
        await this.sendProfileMessage(phoneNumber, familyInfo, language);
      } else if (message === 'hours' || message === 'horários' || message === 'horarios') {
        await this.sendHoursMessage(phoneNumber, language);
      } else if (message === 'rules' || message === 'regras') {
        await this.sendRulesMessage(phoneNumber, language);
      } else if (message === 'events' || message === 'eventos') {
        await this.sendEventsMessage(phoneNumber, language);
      } else if (message === 'unsubscribe' || message === 'cancelar inscrição' || message === 'cancelar inscricao') {
        await this.sendUnsubscribeMessage(phoneNumber, language);
      // NOTE: Order command disabled - payment functionality not needed currently
      // DO NOT DELETE - May be needed in the future for online payment integration
      // } else if (message === 'order' || message === 'pedido' || message === 'order food' || message === 'pedir comida') {
      //   await this.sendOrderMessage(phoneNumber, familyInfo.id, language);
      } else if (message === 'book' || message === 'reservar' || message === 'booking' || message === 'reserva') {
        await this.sendBookingMessage(phoneNumber, familyInfo.id, language);
      } else if (message === 'confirm' || message === 'confirmar') {
        await this.sendResponse(phoneNumber, this.i18nService.getTranslation('appointment_confirmed', language));
      } else if (message === 'cancel' || message === 'cancelar') {
        await this.sendResponse(phoneNumber, this.i18nService.getTranslation('appointment_cancelled', language));
      } else {
        await this.sendResponse(phoneNumber, this.i18nService.getTranslationWithParams('command_not_found', { body }, language));
      }

    } catch (error) {
      this.logger.error(`Failed to process message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      await this.sendResponse(phoneNumber, this.i18nService.getTranslation('command_not_found', 'EN'));
    }
  }

  private async sendResponse(to: string, message: string) {
    try {
      await this.twilioService.sendTextMessage(to, message);
      this.logger.log(`Response sent to ${to}: ${message}`);
    } catch (error) {
      this.logger.error(`Failed to send response to ${to}:`, error);
    }
  }

  private async sendMenuMessage(phoneNumber: string, language: 'EN' | 'PT') {
    const menuTitle = this.i18nService.getTranslation('menu_title', language);
    const foodTitle = this.i18nService.getTranslation('menu_food', language);
    const drinksTitle = this.i18nService.getTranslation('menu_drinks', language);

    let message = `${menuTitle}\n\n${foodTitle}\n`;
    message += '• Mini Toast Teddy - €6\n';
    message += '• Mini Pancakes (Sweet) - €7\n';
    message += '• Mini Teddy Pancakes - €7\n';
    message += '• Mixed Toast - €7.5\n';
    message += '• Tuna Toast - €9\n';
    message += '• Vegan Toast - €9.5\n\n';
    message += `${drinksTitle}\n`;
    message += '• Espresso - €0.8\n';
    message += '• Americano - €0.9\n';
    message += '• Coffee with Milk - €1.5\n';
    message += '• Teddy Coffee - €1.5\n';
    message += '• Natural Orange Juice - €3';

    await this.sendResponse(phoneNumber, message);
  }

  private async sendLoyaltyMessage(phoneNumber: string, familyId: string, language: 'EN' | 'PT') {
    const loyaltyStatus = await this.loyaltyService.getLoyaltyStatus(familyId);

    if (loyaltyStatus) {
      const current = loyaltyStatus.currentCycleCount;
      const remaining = loyaltyStatus.remainingVisits;

      let message = this.i18nService.getTranslationWithParams('loyalty_progress', {
        current: current.toString(),
        remaining: remaining > 0 ? `${remaining} more visits` : 'You\'ve earned a voucher!'
      }, language);

      await this.sendResponse(phoneNumber, message);

      // Отправляем карточку лояльности
      await this.loyaltyService.sendLoyaltyCard(familyId);
    } else {
      await this.sendResponse(phoneNumber, this.i18nService.getTranslation('loyalty_progress', language));
    }
  }

  private async sendHelpMessage(phoneNumber: string, language: 'EN' | 'PT') {
    const helpTitle = this.i18nService.getTranslation('help_title', language);
    const helpCommands = this.i18nService.getTranslation('help_commands', language);

    await this.sendResponse(phoneNumber, `${helpTitle}\n\n${helpCommands}`);
  }


  private async sendContactMessage(phoneNumber: string, language: 'EN' | 'PT') {
    const contactTitle = this.i18nService.getTranslation('contact_title', language);
    const contactInfo = this.i18nService.getTranslation('contact_info', language);

    await this.sendResponse(phoneNumber, `${contactTitle}\n\n${contactInfo}`);
  }

  private async sendProfileMessage(phoneNumber: string, familyInfo: any, language: 'EN' | 'PT') {
    const profileTitle = this.i18nService.getTranslation('profile_title', language);
    const profileInfo = this.i18nService.getTranslationWithParams('profile_info', {
      clientCode: familyInfo.clientCode,
      language: familyInfo.preferredLanguage,
      totalVisits: familyInfo.loyaltyCounter?.totalVisits || 0,
      current: familyInfo.loyaltyCounter?.currentCycleCount || 0
    }, language);

    await this.sendResponse(phoneNumber, `${profileTitle}\n\n${profileInfo}`);
  }

  private async sendHoursMessage(phoneNumber: string, language: 'EN' | 'PT') {
    const hoursTitle = this.i18nService.getTranslation('hours_title', language);
    const hoursWeekdays = this.i18nService.getTranslation('hours_weekdays', language);
    const hoursWeekends = this.i18nService.getTranslation('hours_weekends', language);
    const playPrice = this.i18nService.getTranslationWithParams('play_price', { price: '8' }, language);

    const message = `${hoursTitle}\n\n${hoursWeekdays}\n${hoursWeekends}\n\n${playPrice}`;
    await this.sendResponse(phoneNumber, message);
  }

  private async sendRulesMessage(phoneNumber: string, language: 'EN' | 'PT') {
    const rulesTitle = this.i18nService.getTranslation('rules_title', language);
    const rulesList = this.i18nService.getTranslation('rules_list', language);

    await this.sendResponse(phoneNumber, `${rulesTitle}\n\n${rulesList}`);
  }

  private async sendEventsMessage(phoneNumber: string, language: 'EN' | 'PT') {
    const eventsTitle = this.i18nService.getTranslation('events_title', language);
    const noEvents = this.i18nService.getTranslation('no_events', language);

    await this.sendResponse(phoneNumber, `${eventsTitle}\n\n${noEvents}`);
  }

  private async sendUnsubscribeMessage(phoneNumber: string, language: 'EN' | 'PT') {
    try {
      // Получаем информацию о семье
      const family = await this.prisma.family.findUnique({
        where: { phone: phoneNumber }
      });

      if (!family) {
        await this.sendResponse(phoneNumber, this.i18nService.getTranslation('family_not_found', language));
        return;
      }

      // Получаем активные подписки
      const subscriptions = await this.subscriptionsService.getFamilySubscriptions(family.id);

      if (subscriptions.length === 0) {
        const message = this.i18nService.getTranslation('no_subscriptions', language);
        await this.sendResponse(phoneNumber, message);
        return;
      }

      // Отправляем информацию о подписках
      let message = this.i18nService.getTranslation('current_subscriptions', language) + '\n\n';

      subscriptions.forEach(sub => {
        const typeName = this.i18nService.getTranslation(`subscription_type_${sub.type}`, language);
        message += `• ${typeName}\n`;
      });

      message += '\n' + this.i18nService.getTranslation('unsubscribe_instructions', language);

      await this.sendResponse(phoneNumber, message);
    } catch (error) {
      this.logger.error(`Failed to send unsubscribe message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async sendBookingMessage(phoneNumber: string, familyId: string, language: 'EN' | 'PT') {
    try {
      // Получаем активные события
      const events = await this.eventsService.getActiveEvents();

      if (events.length === 0) {
        const noEvents = this.i18nService.getTranslation('no_events', language);
        await this.sendResponse(phoneNumber, noEvents);
        return;
      }

      // Получаем существующие бронирования семьи
      const existingBookings = await this.bookingsService.getFamilyBookings(familyId);

      let message = this.i18nService.getTranslation('booking_title', language) + '\n\n';

      // Показываем доступные события
      message += this.i18nService.getTranslation('available_events', language) + '\n\n';

      events.slice(0, 3).forEach((event, index) => {
        const availableSpots = event.maxParticipants - event.bookings.length;
        message += `${index + 1}. *${event.title}*\n`;
        message += `📅 ${event.date.toLocaleDateString()} at ${event.time}\n`;
        message += `💰 €${event.price} per person\n`;
        message += `👥 ${availableSpots} spots available\n\n`;
      });

      // Показываем существующие бронирования
      if (existingBookings.length > 0) {
        message += this.i18nService.getTranslation('your_bookings', language) + '\n\n';
        existingBookings.slice(0, 2).forEach((booking, index) => {
          message += `${index + 1}. *${booking.event.title}*\n`;
          message += `📅 ${booking.event.date.toLocaleDateString()}\n`;
          message += `👥 ${booking.participants} participants\n`;
          message += `Status: ${booking.status}\n\n`;
        });
      }

      message += this.i18nService.getTranslation('booking_instructions', language);

      await this.sendResponse(phoneNumber, message);
    } catch (error) {
      this.logger.error(`Failed to send booking message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // NOTE: Payment/Orders functionality is currently disabled but kept for future use
  // DO NOT DELETE - This method may be needed in the future for online payment integration
  // When re-enabling, uncomment OrdersService import and injection in constructor
  /*
  private async sendOrderMessage(phoneNumber: string, familyId: string, language: 'EN' | 'PT') {
    try {
      // Получаем историю заказов семьи
      const orders = await this.ordersService.getFamilyOrders(familyId, 3);

      let message: string;

      if (language === 'EN') {
        message = `🍽️ *Order Food*\n\nTo place an order, please:\n\n1. Visit our café counter\n2. Show your customer number: ${familyId}\n3. Choose from our menu\n4. Pay with MBWay or cash\n\n*Recent Orders:*\n`;

        if (orders.length > 0) {
          orders.forEach((order, index) => {
            message += `${index + 1}. Order #${order.id} - €${order.totalAmount} (${order.status})\n`;
          });
        } else {
          message += `No recent orders yet.`;
        }

        message += `\n\nType "menu" to see our full menu!`;
      } else {
        message = `🍽️ *Pedir Comida*\n\nPara fazer um pedido, por favor:\n\n1. Visite o nosso balcão do café\n2. Mostre o seu número de cliente: ${familyId}\n3. Escolha do nosso menu\n4. Pague com MBWay ou dinheiro\n\n*Pedidos Recentes:*\n`;

        if (orders.length > 0) {
          orders.forEach((order, index) => {
            message += `${index + 1}. Pedido #${order.id} - €${order.totalAmount} (${order.status})\n`;
          });
        } else {
          message += `Ainda não há pedidos recentes.`;
        }

        message += `\n\nDigite "menu" para ver o nosso menu completo!`;
      }

      await this.sendResponse(phoneNumber, message);
    } catch (error) {
      this.logger.error(`Failed to send order message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      await this.sendResponse(phoneNumber, this.i18nService.getTranslation('command_not_found', language));
    }
  }
  */
}
