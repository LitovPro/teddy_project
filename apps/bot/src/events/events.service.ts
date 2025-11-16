import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TwilioService } from '../twilio/twilio.service';
import { I18nService } from '../i18n/i18n.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class EventsService {
    constructor(
        private prisma: PrismaService,
        private twilioService: TwilioService,
        private i18nService: I18nService,
        private subscriptionsService: SubscriptionsService,
    ) { }

    /**
     * Создает новое событие
     */
    async createEvent(dto: {
        title: string;
        description: string;
        date: Date;
        time: string;
        duration: number;
        maxParticipants: number;
        price: number;
        staffId: string;
    }): Promise<any> {
        try {
            const event = await this.prisma.event.create({
                data: {
                    titleEn: dto.title,
                    titlePt: dto.title,
                    descriptionEn: dto.description,
                    descriptionPt: dto.description,
                    date: dto.date,
                    time: dto.time,
                    capacity: dto.maxParticipants,
                    price: dto.price
                }
            });

            // Отправляем уведомление подписчикам на события
            await this.notifyEventSubscribers(event);

            return event;
        } catch (error) {
            console.error('Failed to create event:', error);
            throw error;
        }
    }

    /**
     * Получает все активные события
     */
    async getActiveEvents(): Promise<any[]> {
        try {
            return await this.prisma.event.findMany({
                where: {
                    isActive: true,
                    date: {
                        gte: new Date()
                    }
                },
                orderBy: { date: 'asc' },
                include: {
                    bookings: {
                        where: { status: 'CONFIRMED' },
                        select: { id: true }
                    }
                }
            });
        } catch (error) {
            console.error('Failed to get active events:', error);
            throw error;
        }
    }

    /**
     * Получает событие по ID
     */
    async getEventById(eventId: string): Promise<any> {
        try {
            return await this.prisma.event.findUnique({
                where: { id: eventId },
                include: {
                    bookings: {
                        include: {
                            family: {
                                select: { phone: true, preferredLanguage: true }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Failed to get event by ID:', error);
            throw error;
        }
    }

    /**
     * Обновляет событие
     */
    async updateEvent(eventId: string, dto: any): Promise<any> {
        try {
            return await this.prisma.event.update({
                where: { id: eventId },
                data: dto
            });
        } catch (error) {
            console.error('Failed to update event:', error);
            throw error;
        }
    }

    /**
     * Отменяет событие
     */
    async cancelEvent(eventId: string, reason: string): Promise<any> {
        try {
            const event = await this.prisma.event.update({
                where: { id: eventId },
                data: {
                    isActive: false
                },
                include: {
                    bookings: {
                        where: { status: 'CONFIRMED' },
                        include: {
                            family: true
                        }
                    }
                }
            });

            // Уведомляем всех участников об отмене
            for (const booking of event.bookings) {
                const message = this.i18nService.getTranslationWithParams(
                    'event.cancelled',
                    {
                        eventTitle: event.titleEn,
                        reason: reason
                    },
                    (booking.family.preferredLanguage as 'EN' | 'PT') || 'PT'
                );

                await this.twilioService.sendMessage(booking.family.phone, message);
            }

            return event;
        } catch (error) {
            console.error('Failed to cancel event:', error);
            throw error;
        }
    }

    /**
     * Получает статистику событий
     */
    async getEventStats(): Promise<any> {
        try {
            const [total, active, cancelled, completed] = await Promise.all([
                this.prisma.event.count(),
                this.prisma.event.count({ where: { isActive: true } }),
                this.prisma.event.count({ where: { isActive: false } }),
                this.prisma.event.count({ where: { isActive: false } })
            ]);

            const totalBookings = await this.prisma.booking.count({
                where: { status: 'CONFIRMED' }
            });

            return {
                total,
                active,
                cancelled,
                completed,
                totalBookings,
                averageParticipants: total > 0 ? totalBookings / total : 0
            };
        } catch (error) {
            console.error('Failed to get event stats:', error);
            throw error;
        }
    }

    /**
     * Уведомляет подписчиков о новом событии
     */
    private async notifyEventSubscribers(event: any): Promise<void> {
        try {
            const subscribers = await this.subscriptionsService.getSubscribers('events');

            for (const subscription of subscribers) {
                const message = this.i18nService.getTranslationWithParams(
                    'event.new_event',
                    {
                        title: event.titleEn,
                        date: event.date.toLocaleDateString(),
                        time: event.time,
                        price: event.price
                    },
                    (subscription.family.preferredLanguage as 'EN' | 'PT') || 'PT'
                );

                await this.twilioService.sendMessage(subscription.family.phone, message);
            }
        } catch (error) {
            console.error('Failed to notify event subscribers:', error);
        }
    }
}
