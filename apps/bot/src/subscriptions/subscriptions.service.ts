import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TwilioService } from '../twilio/twilio.service';
import { I18nService } from '../i18n/i18n.service';

@Injectable()
export class SubscriptionsService {
    constructor(
        private prisma: PrismaService,
        private twilioService: TwilioService,
        private i18nService: I18nService,
    ) { }

    /**
     * Подписывает семью на рассылки
     */
    async subscribeFamily(familyId: string, subscriptionType: 'events' | 'promotions' | 'news'): Promise<any> {
        try {
            const family = await this.prisma.family.findUnique({
                where: { id: familyId },
                include: { consent: true }
            });

            if (!family) {
                throw new Error('Family not found');
            }

            // Проверяем согласие на маркетинг
            if (!family.consentMarketing) {
                throw new Error('Marketing consent required');
            }

            // Создаем или обновляем подписку
            const subscription = await this.prisma.subscription.upsert({
                where: {
                    familyId_topic: {
                        familyId: familyId,
                        topic: subscriptionType as any
                    }
                },
                update: {
                    status: 'ON'
                },
                create: {
                    familyId: familyId,
                    topic: subscriptionType as any,
                    status: 'ON'
                }
            });

            // Отправляем подтверждение подписки
            const message = this.i18nService.getTranslationWithParams(
                'subscription.confirmed',
                { type: subscriptionType },
                (family.preferredLanguage as 'EN' | 'PT') || 'PT'
            );

            await this.twilioService.sendMessage(family.phone, message);

            return subscription;
        } catch (error) {
            console.error('Failed to subscribe family:', error);
            throw error;
        }
    }

    /**
     * Отписывает семью от рассылок
     */
    async unsubscribeFamily(familyId: string, subscriptionType: 'events' | 'promotions' | 'news'): Promise<any> {
        try {
            const family = await this.prisma.family.findUnique({
                where: { id: familyId }
            });

            if (!family) {
                throw new Error('Family not found');
            }

            // Обновляем подписку
            const subscription = await this.prisma.subscription.update({
                where: {
                    familyId_topic: {
                        familyId: familyId,
                        topic: subscriptionType as any
                    }
                },
                data: {
                    status: 'OFF'
                }
            });

            // Отправляем подтверждение отписки
            const message = this.i18nService.getTranslationWithParams(
                'subscription.unsubscribed',
                { type: subscriptionType },
                (family.preferredLanguage as 'EN' | 'PT') || 'PT'
            );

            await this.twilioService.sendMessage(family.phone, message);

            return subscription;
        } catch (error) {
            console.error('Failed to unsubscribe family:', error);
            throw error;
        }
    }

    /**
     * Получает активные подписки семьи
     */
    async getFamilySubscriptions(familyId: string): Promise<any[]> {
        try {
            return await this.prisma.subscription.findMany({
                where: {
                    familyId: familyId,
                    status: 'ON'
                }
            });
        } catch (error) {
            console.error('Failed to get family subscriptions:', error);
            throw error;
        }
    }

    /**
     * Получает всех подписчиков по типу
     */
    async getSubscribers(subscriptionType: 'events' | 'promotions' | 'news'): Promise<any[]> {
        try {
            return await this.prisma.subscription.findMany({
                where: {
                    topic: subscriptionType as any,
                    status: 'ON'
                },
                include: {
                    family: true
                }
            });
        } catch (error) {
            console.error('Failed to get subscribers:', error);
            throw error;
        }
    }

    /**
     * Проверяет подписку семьи
     */
    async isSubscribed(familyId: string, subscriptionType: 'events' | 'promotions' | 'news'): Promise<boolean> {
        try {
            const subscription = await this.prisma.subscription.findUnique({
                where: {
                    familyId_topic: {
                        familyId: familyId,
                        topic: subscriptionType as any
                    }
                }
            });

            return subscription?.status === 'ON' || false;
        } catch (error) {
            console.error('Failed to check subscription:', error);
            return false;
        }
    }

    /**
     * Получает статистику подписок
     */
    async getSubscriptionStats(): Promise<any> {
        try {
            const [events, promotions, news, total] = await Promise.all([
                this.prisma.subscription.count({
                    where: { topic: 'EVENTS', status: 'ON' }
                }),
                this.prisma.subscription.count({
                    where: { topic: 'PROMOS', status: 'ON' }
                }),
                this.prisma.subscription.count({
                    where: { topic: 'PROMOS', status: 'ON' }
                }),
                this.prisma.subscription.count({
                    where: { status: 'ON' }
                })
            ]);

            return {
                events,
                promotions,
                news,
                total,
                breakdown: {
                    events: events,
                    promotions: promotions,
                    news: news
                }
            };
        } catch (error) {
            console.error('Failed to get subscription stats:', error);
            throw error;
        }
    }
}
