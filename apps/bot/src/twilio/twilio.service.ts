import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

export interface TwilioMessage {
    to: string;
    from: string;
    body?: string;
    contentSid?: string;
    contentVariables?: string;
}

@Injectable()
export class TwilioService {
    private readonly logger = new Logger(TwilioService.name);
    private readonly client: any;
    private readonly fromNumber: string;

    constructor(private configService: ConfigService) {
        const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
        const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
        this.fromNumber = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER');

        if (!accountSid || !authToken || !this.fromNumber) {
            this.logger.error('Twilio credentials not configured');
            throw new Error('Twilio credentials not configured');
        }

        this.client = twilio(accountSid, authToken);
        this.logger.log('Twilio service initialized');
    }

    /**
     * Send a simple text message (alias for sendTextMessage)
     */
    async sendMessage(to: string, body: string): Promise<string> {
        return this.sendTextMessage(to, body);
    }

    /**
     * Send a simple text message
     */
    async sendTextMessage(to: string, body: string): Promise<string> {
        try {
            this.logger.log(`Sending text message to ${to}: ${body}`);

            const message = await this.client.messages.create({
                to: `whatsapp:${to}`,
                from: `whatsapp:${this.fromNumber}`,
                body: body,
            });

            this.logger.log(`Message sent successfully: ${message.sid}`);
            return message.sid;
        } catch (error) {
            this.logger.error(`Failed to send text message: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    /**
     * Send a template message with variables
     */
    async sendTemplateMessage(
        to: string,
        contentSid: string,
        contentVariables: Record<string, string>
    ): Promise<string> {
        try {
            this.logger.log(`Sending template message to ${to} with template ${contentSid}`);

            const message = await this.client.messages.create({
                to: `whatsapp:${to}`,
                from: `whatsapp:${this.fromNumber}`,
                contentSid: contentSid,
                contentVariables: JSON.stringify(contentVariables),
            });

            this.logger.log(`Template message sent successfully: ${message.sid}`);
            return message.sid;
        } catch (error) {
            this.logger.error(`Failed to send template message: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    /**
     * Send appointment reminder (using your template)
     */
    async sendAppointmentReminder(
        to: string,
        date: string,
        time: string
    ): Promise<string> {
        const contentSid = 'HXb5b62575e6e4ff6129ad7c8efe1f983e'; // Your template SID
        const contentVariables = {
            '1': date,
            '2': time,
        };

        return this.sendTemplateMessage(to, contentSid, contentVariables);
    }

    /**
     * Send loyalty progress update
     */
    async sendLoyaltyProgress(
        to: string,
        current: number,
        target: number,
        language: 'EN' | 'PT' = 'EN'
    ): Promise<string> {
        const messages = {
            EN: `🌟 Your loyalty progress: ${current}/${target} visits. ${target - current} more visits to earn your free hour!`,
            PT: `🌟 Seu progresso de fidelidade: ${current}/${target} visitas. Mais ${target - current} visitas para ganhar sua hora grátis!`,
        };

        return this.sendTextMessage(to, messages[language]);
    }

    /**
     * Send voucher notification
     */
    async sendVoucherNotification(
        to: string,
        voucherCode: string,
        language: 'EN' | 'PT' = 'EN'
    ): Promise<string> {
        const messages = {
            EN: `🎉 Congratulations! You've earned a free hour voucher! Code: ${voucherCode}. Show this to staff to redeem.`,
            PT: `🎉 Parabéns! Você ganhou um voucher de uma hora grátis! Código: ${voucherCode}. Mostre para a equipe para resgatar.`,
        };

        return this.sendTextMessage(to, messages[language]);
    }

    /**
     * Send visit confirmation
     */
    async sendVisitConfirmation(
        to: string,
        visitCode: string,
        language: 'EN' | 'PT' = 'EN'
    ): Promise<string> {
        const messages = {
            EN: `✅ Visit confirmed! Your code: ${visitCode}. Show this to staff to complete your visit.`,
            PT: `✅ Visita confirmada! Seu código: ${visitCode}. Mostre para a equipe para completar sua visita.`,
        };

        return this.sendTextMessage(to, messages[language]);
    }

    /**
     * Send welcome message
     */
    async sendWelcomeMessage(
        to: string,
        clientCode: string,
        language: 'EN' | 'PT' = 'EN'
    ): Promise<string> {
        const messages = {
            EN: `🎉 Welcome to Teddy & Friends! Your client code: ${clientCode}. Visit us 5 times to earn 1 hour free play!`,
            PT: `🎉 Bem-vindo ao Teddy & Friends! Seu código de cliente: ${clientCode}. Visite-nos 5 vezes para ganhar 1 hora de brincadeira grátis!`,
        };

        return this.sendTextMessage(to, messages[language]);
    }
}
