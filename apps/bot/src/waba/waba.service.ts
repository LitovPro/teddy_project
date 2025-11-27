import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import type { Language, WhatsAppMessage } from '@teddy/shared';
import { MessageProcessorService } from './message-processor.service';
import { ConversationService } from './conversation.service';
import type { MessageProcessingResult } from './conversation.types';

export interface WabaClient {
  sendMessage(to: string, message: string): Promise<void>;
  sendTemplate(to: string, templateName: string, language: Language, variables?: Record<string, string>): Promise<void>;
  sendImage(to: string, imageUrl: string, caption?: string): Promise<void>;
}

@Injectable()
export class WabaClientMock implements WabaClient {
  private readonly logger = new Logger(WabaClientMock.name);

  async sendMessage(to: string, message: string): Promise<void> {
    this.logger.log(`[MOCK] Sending message to ${to}: ${message}`);
  }

  async sendTemplate(to: string, templateName: string, language: Language, variables?: Record<string, string>): Promise<void> {
    this.logger.log(`[MOCK] Sending template ${templateName} (${language}) to ${to}`, variables);
  }

  async sendImage(to: string, imageUrl: string, caption?: string): Promise<void> {
    this.logger.log(`[MOCK] Sending image to ${to}: ${imageUrl} with caption: ${caption}`);
  }
}

@Injectable()
export class Waba360DialogClient implements WabaClient {
  private readonly logger = new Logger(Waba360DialogClient.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('DIALOG360_API_KEY') || '';
    this.baseUrl = this.configService.get<string>('DIALOG360_BASE_URL') || 'https://waba-v2.360dialog.io';

    if (!this.apiKey) {
      this.logger.error('DIALOG360_API_KEY not configured');
      throw new Error('DIALOG360_API_KEY is required');
    }

    this.logger.log('360dialog client initialized');
  }

  async sendMessage(to: string, message: string): Promise<void> {
    try {
      // Remove whatsapp: prefix if present
      const phoneNumber = to.replace('whatsapp:', '').replace('+', '');

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'D360-API-KEY': this.apiKey,
        },
        body: JSON.stringify({
          recipient_type: 'individual',
          to: phoneNumber,
          type: 'text',
          text: {
            body: message,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Failed to send message: ${response.status} ${errorText}`);
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const result = await response.json();
      this.logger.log(`Message sent successfully to ${to}: ${result.messages?.[0]?.id || 'unknown'}`);
    } catch (error) {
      this.logger.error(`Error sending message to ${to}:`, error);
      throw error;
    }
  }

  async sendTemplate(to: string, templateName: string, language: Language, variables?: Record<string, string>): Promise<void> {
    try {
      // Remove whatsapp: prefix if present
      const phoneNumber = to.replace('whatsapp:', '').replace('+', '');

      // Convert variables to format expected by 360dialog
      const components: any[] = [];
      if (variables) {
        components.push({
          type: 'body',
          parameters: Object.entries(variables).map(([key, value]) => ({
            type: 'text',
            text: value,
          })),
        });
      }

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'D360-API-KEY': this.apiKey,
        },
        body: JSON.stringify({
          recipient_type: 'individual',
          to: phoneNumber,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: language === 'PT' ? 'pt' : 'en',
            },
            components: components.length > 0 ? components : undefined,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Failed to send template: ${response.status} ${errorText}`);
        throw new Error(`Failed to send template: ${response.status}`);
      }

      const result = await response.json();
      this.logger.log(`Template sent successfully to ${to}: ${result.messages?.[0]?.id || 'unknown'}`);
    } catch (error) {
      this.logger.error(`Error sending template to ${to}:`, error);
      throw error;
    }
  }

  async sendImage(to: string, imageUrl: string, caption?: string): Promise<void> {
    try {
      // Remove whatsapp: prefix if present
      const phoneNumber = to.replace('whatsapp:', '').replace('+', '');

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'D360-API-KEY': this.apiKey,
        },
        body: JSON.stringify({
          recipient_type: 'individual',
          to: phoneNumber,
          type: 'image',
          image: {
            link: imageUrl,
            caption: caption,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Failed to send image: ${response.status} ${errorText}`);
        throw new Error(`Failed to send image: ${response.status}`);
      }

      const result = await response.json();
      this.logger.log(`Image sent successfully to ${to}: ${result.messages?.[0]?.id || 'unknown'}`);
    } catch (error) {
      this.logger.error(`Error sending image to ${to}:`, error);
      throw error;
    }
  }
}

@Injectable()
export class WabaService {
  private readonly logger = new Logger(WabaService.name);
  private readonly client: WabaClient;

  constructor(
    private configService: ConfigService,
    private messageProcessor: MessageProcessorService,
    private conversationService: ConversationService,
  ) {
    // Use 360dialog client if API key is configured, otherwise use mock
    const dialog360ApiKey = this.configService.get<string>('DIALOG360_API_KEY');
    if (dialog360ApiKey) {
      this.logger.log('Using 360dialog client');
      this.client = new Waba360DialogClient(configService);
    } else {
      this.logger.warn('DIALOG360_API_KEY not configured, using mock client');
      this.client = new WabaClientMock();
    }
  }

  async sendWelcomeMessage(waId: string, clientCode: string, language: Language) {
    const template = language === 'PT' ? 'welcome_pt' : 'welcome_en';
    await this.client.sendTemplate(waId, template, language, { clientCode });
  }

  async sendLoyaltyProgress(waId: string, current: number, target: number, language: Language, cardImageUrl?: string) {
    if (cardImageUrl) {
      await this.client.sendImage(waId, cardImageUrl, `Progress: ${current}/${target}`);
    } else {
      await this.client.sendMessage(waId, `Your progress: ${current}/${target} visits`);
    }
  }

  async sendVoucherIssued(waId: string, voucherCode: string, language: Language, voucherImageUrl?: string) {
    if (voucherImageUrl) {
      await this.client.sendImage(waId, voucherImageUrl, `Your voucher: ${voucherCode}`);
    } else {
      await this.client.sendMessage(waId, `🎉 Voucher ready! Code: ${voucherCode}`);
    }
  }

  async sendCheckoutMessage(waId: string, language: Language) {
    const template = language === 'PT' ? 'checkout_pt' : 'checkout_en';
    await this.client.sendTemplate(waId, template, language);
  }

  verifyWebhook(token: string): boolean {
    const verifyToken = this.configService.get('WABA_VERIFY_TOKEN');
    return token === verifyToken;
  }

  verifySignature(payload: string, signature: string): boolean {
    const appSecret = this.configService.get('WABA_APP_SECRET');

    if (!appSecret) {
      this.logger.error('WABA_APP_SECRET not configured');
      return false;
    }

    try {
      // Remove 'sha256=' prefix if present
      const cleanSignature = signature.replace('sha256=', '');

      // Create HMAC hash
      const expectedSignature = crypto
        .createHmac('sha256', appSecret)
        .update(payload, 'utf8')
        .digest('hex');

      // Compare signatures using timing-safe comparison
      const isValid = crypto.timingSafeEqual(
        Buffer.from(cleanSignature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );

      if (!isValid) {
        this.logger.warn('Invalid webhook signature');
      }

      return isValid;
    } catch (error) {
      this.logger.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  // Основной метод для обработки входящих сообщений
  async processMessage(message: WhatsAppMessage, _phoneNumberId: string): Promise<void> {
    this.logger.log(`Processing message from ${message.from}, type: ${message.type}`);

    try {
      // Обрабатываем сообщение через MessageProcessor
      const result: MessageProcessingResult = await this.messageProcessor.processMessage(message);

      if (!result.handled) {
        this.logger.warn(`Message from ${message.from} was not handled`);
        return;
      }

      // Отправляем ответ, если есть
      if (result.response) {
        await this.sendResponse(message.from, result.response);
      }

      // Выполняем дополнительные действия
      if (result.actions) {
        for (const action of result.actions) {
          await this.executeAction(action);
        }
      }

      this.logger.log(`Successfully processed message from ${message.from}`);

    } catch (error) {
      this.logger.error(`Error processing message from ${message.from}:`, error);

      // Отправляем сообщение об ошибке пользователю
      await this.client.sendMessage(
        message.from,
        'Sorry, something went wrong. Please try again later.'
      );
    }
  }

  // Отправка ответа пользователю
  private async sendResponse(waId: string, response: any): Promise<void> {
    switch (response.type) {
      case 'text':
        await this.client.sendMessage(waId, response.content);
        break;

      case 'template':
        await this.client.sendTemplate(waId, response.templateName, response.language, response.variables);
        break;

      case 'image':
        await this.client.sendImage(waId, response.imageUrl, response.caption);
        break;

      case 'interactive':
        // Для интерактивных сообщений используем специальный метод
        await this.sendInteractiveMessage(waId, response.content);
        break;

      default:
        this.logger.warn(`Unknown response type: ${response.type}`);
    }
  }

  // Отправка интерактивных сообщений (кнопки, списки)
  private async sendInteractiveMessage(waId: string, content: any): Promise<void> {
    // В mock режиме просто логируем
    this.logger.log(`[MOCK] Sending interactive message to ${waId}:`, JSON.stringify(content, null, 2));

    // TODO: Реализовать отправку интерактивных сообщений через реальный WABA API
    // await this.client.sendInteractive(waId, content);
  }

  // Выполнение дополнительных действий
  private async executeAction(action: any): Promise<void> {
    switch (action.type) {
      case 'create_family':
        this.logger.log('Family created:', action.payload);
        break;

      case 'update_context':
        this.logger.log('Context updated:', action.payload);
        break;

      case 'log_interaction':
        this.logger.log('Interaction logged:', action.payload);
        break;

      default:
        this.logger.warn(`Unknown action type: ${action.type}`);
    }
  }
}
