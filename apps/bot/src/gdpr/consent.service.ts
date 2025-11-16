import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TwilioService } from '../twilio/twilio.service';
import { I18nService } from '../i18n/i18n.service';

@Injectable()
export class ConsentService {
    constructor(
        private prisma: PrismaService,
        private twilioService: TwilioService,
        private i18nService: I18nService,
    ) { }

    /**
     * Обновляет согласие семьи
     */
    async updateConsent(familyId: string, consentData: {
        marketing?: boolean;
        gdpr?: boolean;
        dataProcessing?: boolean;
        analytics?: boolean;
    }): Promise<any> {
        try {
            const family = await this.prisma.family.findUnique({
                where: { id: familyId }
            });

            if (!family) {
                throw new Error('Family not found');
            }

            // Создаем или обновляем согласие
            const consent = await this.prisma.consent.upsert({
                where: { familyId: familyId },
                update: {
                    type: 'marketing',
                    granted: consentData.marketing ?? false,
                    grantedAt: consentData.marketing ? new Date() : null,
                    withdrawnAt: !consentData.marketing ? new Date() : null
                },
                create: {
                    familyId: familyId,
                    type: 'marketing',
                    granted: consentData.marketing ?? false,
                    grantedAt: consentData.marketing ? new Date() : null
                }
            });

            // Обновляем семейную запись
            await this.prisma.family.update({
                where: { id: familyId },
                data: {
                    consentMarketing: consentData.marketing ?? family.consentMarketing,
                    consentGdpr: consentData.gdpr ?? family.consentGdpr
                }
            });

            // Отправляем подтверждение
            const message = this.i18nService.getTranslationWithParams(
                'consent.updated',
                {
                    marketing: consentData.marketing ? 'enabled' : 'disabled',
                    gdpr: consentData.gdpr ? 'enabled' : 'disabled'
                },
                (family.preferredLanguage as 'EN' | 'PT') || 'PT'
            );

            await this.twilioService.sendMessage(family.phone, message);

            return consent;
        } catch (error) {
            console.error('Failed to update consent:', error);
            throw error;
        }
    }

    /**
     * Получает согласие семьи
     */
    async getFamilyConsent(familyId: string): Promise<any> {
        try {
            return await this.prisma.consent.findUnique({
                where: { familyId: familyId }
            });
        } catch (error) {
            console.error('Failed to get family consent:', error);
            throw error;
        }
    }

    /**
     * Получает статистику согласий
     */
    async getConsentStats(): Promise<any> {
        try {
            const [total, marketing, gdpr, dataProcessing, analytics] = await Promise.all([
                this.prisma.consent.count(),
                this.prisma.consent.count({ where: { granted: true } }),
                this.prisma.consent.count({ where: { granted: true } }),
                this.prisma.consent.count({ where: { granted: true } }),
                this.prisma.consent.count({ where: { granted: true } })
            ]);

            return {
                total,
                marketing,
                gdpr,
                dataProcessing,
                analytics,
                percentages: {
                    marketing: total > 0 ? (marketing / total) * 100 : 0,
                    gdpr: total > 0 ? (gdpr / total) * 100 : 0,
                    dataProcessing: total > 0 ? (dataProcessing / total) * 100 : 0,
                    analytics: total > 0 ? (analytics / total) * 100 : 0
                }
            };
        } catch (error) {
            console.error('Failed to get consent stats:', error);
            throw error;
        }
    }

    /**
     * Проверяет, есть ли согласие на маркетинг
     */
    async hasMarketingConsent(familyId: string): Promise<boolean> {
        try {
            const consent = await this.prisma.consent.findUnique({
                where: { familyId: familyId }
            });

            return consent?.granted || false;
        } catch (error) {
            console.error('Failed to check marketing consent:', error);
            return false;
        }
    }

    /**
     * Проверяет, есть ли GDPR согласие
     */
    async hasGdprConsent(familyId: string): Promise<boolean> {
        try {
            const consent = await this.prisma.consent.findUnique({
                where: { familyId: familyId }
            });

            return consent?.granted || false;
        } catch (error) {
            console.error('Failed to check GDPR consent:', error);
            return false;
        }
    }

    /**
     * Отправляет запрос на согласие
     */
    async requestConsent(familyId: string): Promise<void> {
        try {
            const family = await this.prisma.family.findUnique({
                where: { id: familyId }
            });

            if (!family) {
                throw new Error('Family not found');
            }

            const message = this.i18nService.getTranslationWithParams(
                'consent.request',
                {},
                (family.preferredLanguage as 'EN' | 'PT') || 'PT'
            );

            await this.twilioService.sendMessage(family.phone, message);
        } catch (error) {
            console.error('Failed to request consent:', error);
            throw error;
        }
    }
}
