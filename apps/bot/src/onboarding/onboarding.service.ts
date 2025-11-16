import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TwilioService } from '../twilio/twilio.service';
import { QrService } from '../qr/qr.service';

@Injectable()
export class OnboardingService {
    private readonly logger = new Logger(OnboardingService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly twilioService: TwilioService,
        private readonly qrService: QrService,
    ) { }

    /**
     * Обрабатывает первое сообщение "START T&F" и создает семейный профиль
     */
    async handleStartMessage(phoneNumber: string, waId: string): Promise<void> {
        try {
            // Проверяем, существует ли уже семья
            const existingFamily = await this.prisma.family.findFirst({
                where: {
                    OR: [
                        { phone: phoneNumber },
                        { waId: waId }
                    ]
                }
            });

            if (existingFamily) {
                // Семья уже существует, отправляем приветствие
                await this.sendWelcomeBackMessage(phoneNumber, existingFamily);
                return;
            }

            // Создаем новую семью
            const clientCode = await this.generateClientCode();
            const family = await this.prisma.family.create({
                data: {
                    phone: phoneNumber,
                    waId: waId,
                    clientCode: clientCode,
                    onboardingStatus: 'pending',
                    preferredLanguage: 'EN',
                    consentMarketing: false,
                    consentGdpr: false,
                    lastActiveAt: new Date(),
                }
            });

            this.logger.log(`Created new family: ${clientCode} for ${phoneNumber}`);

            // Отправляем сообщение выбора языка
            await this.sendLanguageSelectionMessage(phoneNumber);

        } catch (error) {
            this.logger.error(`Failed to handle start message: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    /**
     * Обрабатывает выбор языка пользователем
     */
    async handleLanguageSelection(phoneNumber: string, language: 'EN' | 'PT'): Promise<void> {
        try {
            const family = await this.prisma.family.findFirst({
                where: { phone: phoneNumber }
            });

            if (!family) {
                this.logger.error(`Family not found for phone: ${phoneNumber}`);
                return;
            }

            // Обновляем язык и завершаем онбординг
            await this.prisma.family.update({
                where: { id: family.id },
                data: {
                    preferredLanguage: language,
                    onboardingStatus: 'onboarded',
                    lastActiveAt: new Date(),
                }
            });

            // Отправляем приветствие на выбранном языке
            await this.sendWelcomeMessage(phoneNumber, language, family.clientCode);

        } catch (error) {
            this.logger.error(`Failed to handle language selection: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    /**
     * Завершает онбординг и отправляет главное меню
     */
    async completeOnboarding(phoneNumber: string): Promise<void> {
        try {
            const family = await this.prisma.family.findFirst({
                where: { phone: phoneNumber }
            });

            if (!family) {
                this.logger.error(`Family not found for phone: ${phoneNumber}`);
                return;
            }

            // Обновляем статус онбординга
            await this.prisma.family.update({
                where: { id: family.id },
                data: {
                    onboardingStatus: 'onboarded',
                    lastActiveAt: new Date(),
                }
            });

            // Отправляем главное меню
            await this.sendMainMenu(phoneNumber, family.preferredLanguage as 'EN' | 'PT');

        } catch (error) {
            this.logger.error(`Failed to complete onboarding: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    /**
     * Генерирует уникальный клиентский код
     */
    private async generateClientCode(): Promise<string> {
        let clientCode: string;
        let isUnique = false;
        let counter = 1;

        while (!isUnique) {
            clientCode = `TF-${counter.toString().padStart(6, '0')}`;

            const existing = await this.prisma.family.findUnique({
                where: { clientCode: clientCode }
            });

            if (!existing) {
                isUnique = true;
            } else {
                counter++;
            }
        }

        return clientCode!;
    }

    /**
     * Отправляет сообщение выбора языка
     */
    private async sendLanguageSelectionMessage(phoneNumber: string): Promise<void> {
        const message = `🏰 Welcome to Teddy & Friends! 🐻

I'm your personal assistant. To get started, please choose your language:

🇬🇧 English
🇵🇹 Português

Reply with "EN" for English or "PT" for Português.`;

        await this.twilioService.sendTextMessage(phoneNumber, message);
    }

    /**
     * Отправляет приветственное сообщение на выбранном языке
     */
    private async sendWelcomeMessage(phoneNumber: string, language: 'EN' | 'PT', clientCode: string): Promise<void> {
        let message: string;

        if (language === 'EN') {
            message = `🎉 Welcome to Teddy & Friends! 🐻

Your customer number is: ${clientCode}
Keep it handy for all café orders! 📌

I'm here to help you with:
🎟 Loyalty program (5 visits = 1 FREE HOUR!)
🧁 Café menu and orders
🕒 Hours & prices
🎉 Events and workshops
ℹ️ Rules and information

Type "menu" to see all available options!`;
        } else {
            message = `🎉 Bem-vindo ao Teddy & Friends! 🐻

O seu número de cliente é: ${clientCode}
Use-o para os pedidos no café! 📌

Estou aqui para ajudar com:
🎟 Programa de fidelidade (5 visitas = 1 HORA GRÁTIS!)
🧁 Menu do café e pedidos
🕒 Horários e preços
🎉 Eventos e oficinas
ℹ️ Regras e informações

Digite "menu" para ver todas as opções!`;
        }

        await this.twilioService.sendTextMessage(phoneNumber, message);

        // Отправляем главное меню через 2 секунды
        setTimeout(async () => {
            await this.sendMainMenu(phoneNumber, language);
        }, 2000);
    }

    /**
     * Отправляет главное меню
     */
    private async sendMainMenu(phoneNumber: string, language: 'EN' | 'PT'): Promise<void> {
        let message: string;

        if (language === 'EN') {
            message = `🤖 *Main Menu*

Choose an option:

🎟 *Loyalty* - Check your loyalty status
🧁 *Café Menu* - View our menu and prices
🕒 *Hours & Prices* - Opening hours and play prices
🎉 *Events* - Upcoming workshops and events
ℹ️ *Rules* - Play area rules and information
👤 *My Profile* - View your profile and settings
📞 *Contact* - Contact information
🚫 *Unsubscribe* - Stop receiving updates

Just type the word (e.g., "loyalty" or "menu") to continue!`;
        } else {
            message = `🤖 *Menu Principal*

Escolha uma opção:

🎟 *Fidelidade* - Verifique o seu status de fidelidade
🧁 *Menu do Café* - Veja o nosso menu e preços
🕒 *Horários e Preços* - Horários de funcionamento e preços
🎉 *Eventos* - Próximas oficinas e eventos
ℹ️ *Regras* - Regras da área de brincadeiras e informações
👤 *Meu Perfil* - Ver o seu perfil e configurações
📞 *Contacto* - Informações de contacto
🚫 *Cancelar Inscrição* - Parar de receber atualizações

Digite a palavra (ex: "fidelidade" ou "menu") para continuar!`;
        }

        await this.twilioService.sendTextMessage(phoneNumber, message);
    }

    /**
     * Отправляет приветствие существующей семье
     */
    private async sendWelcomeBackMessage(phoneNumber: string, family: any): Promise<void> {
        const language = family.preferredLanguage as 'EN' | 'PT';
        let message: string;

        if (language === 'EN') {
            message = `👋 Welcome back to Teddy & Friends! 🐻

Your customer number: ${family.clientCode}

How can I help you today? Type "menu" to see all options!`;
        } else {
            message = `👋 Bem-vindo de volta ao Teddy & Friends! 🐻

O seu número de cliente: ${family.clientCode}

Como posso ajudar hoje? Digite "menu" para ver todas as opções!`;
        }

        await this.twilioService.sendTextMessage(phoneNumber, message);
    }

    /**
     * Получает статус онбординга семьи
     */
    async getOnboardingStatus(phoneNumber: string): Promise<string | null> {
        try {
            const family = await this.prisma.family.findFirst({
                where: { phone: phoneNumber }
            });

            return family?.onboardingStatus || null;
        } catch (error) {
            this.logger.error(`Failed to get onboarding status: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return null;
        }
    }

    /**
     * Получает информацию о семье
     */
    async getFamilyInfo(phoneNumber: string): Promise<any> {
        try {
            const family = await this.prisma.family.findFirst({
                where: { phone: phoneNumber },
                include: {
                    loyaltyCounter: true,
                    visits: {
                        orderBy: { createdAt: 'desc' },
                        take: 5
                    }
                }
            });

            return family;
        } catch (error) {
            this.logger.error(`Failed to get family info: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return null;
        }
    }
}
