import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BroadcastDtoType } from '@teddy/shared';
import { TwilioService } from '../twilio/twilio.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { I18nService } from '../i18n/i18n.service';

@Injectable()
export class BroadcastsService {
    private readonly logger = new Logger(BroadcastsService.name);

    constructor(
        private prisma: PrismaService,
        private twilioService: TwilioService,
        private subscriptionsService: SubscriptionsService,
        private i18nService: I18nService,
    ) { }

    async sendBroadcast(dto: BroadcastDtoType) {
        this.logger.log(`Sending broadcast: ${dto.templateName} to ${dto.audience}`);

        try {
            // Создаем запись о рассылке в базе данных
            const broadcast = await this.prisma.broadcast.create({
                data: {
                    type: dto.audience as any,
                    title: dto.templateName,
                    messageEn: dto.templateName,
                    messagePt: dto.templateName,
                    targetAudience: dto.audience as any,
                    status: 'PENDING',
                    scheduledAt: new Date(),
                    createdBy: 'system'
                }
            });

            // Получаем подписчиков
            const subscribers = await this.subscriptionsService.getSubscribers(dto.audience as any);

            let sentCount = 0;
            let failedCount = 0;

            // Отправляем сообщения
            for (const subscription of subscribers) {
                try {
                    const message = this.i18nService.getTranslationWithParams(
                        `broadcast.${dto.templateName}`,
                        dto.variables || {},
                        subscription.family.preferredLanguage || 'PT'
                    );

                    await this.twilioService.sendMessage(subscription.family.phone, message);
                    sentCount++;
                } catch (error) {
                    this.logger.error(`Failed to send to ${subscription.family.phone}:`, error);
                    failedCount++;
                }
            }

            // Обновляем статус рассылки
            await this.prisma.broadcast.update({
                where: { id: broadcast.id },
                data: {
                    status: 'SENT',
                    sentAt: new Date()
                }
            });

            this.logger.log(`Broadcast completed: ${sentCount} sent, ${failedCount} failed`);

            return {
                broadcastId: broadcast.id,
                sentCount,
                failedCount,
                message: 'Broadcast sent successfully',
            };
        } catch (error) {
            this.logger.error('Failed to send broadcast:', error);
            throw error;
        }
    }

    async getBroadcasts() {
        try {
            return await this.prisma.broadcast.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    createdByStaff: {
                        select: { name: true, email: true }
                    }
                }
            });
        } catch (error) {
            this.logger.error('Failed to get broadcasts:', error);
            throw error;
        }
    }

    /**
     * Получает статистику рассылок
     */
    async getBroadcastStats(): Promise<any> {
        try {
            const [total, sent, pending, failed] = await Promise.all([
                this.prisma.broadcast.count(),
                this.prisma.broadcast.count({ where: { status: 'SENT' } }),
                this.prisma.broadcast.count({ where: { status: 'PENDING' } }),
                this.prisma.broadcast.count({ where: { status: 'FAILED' } })
            ]);

            const totalRecipients = await this.prisma.broadcast.count();

            return {
                total,
                sent,
                pending,
                failed,
                totalRecipients,
                successRate: total > 0 ? (sent / total) * 100 : 0
            };
        } catch (error) {
            this.logger.error('Failed to get broadcast stats:', error);
            throw error;
        }
    }
}
