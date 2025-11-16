import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TwilioService } from '../twilio/twilio.service';
import { I18nService } from '../i18n/i18n.service';

@Injectable()
export class BookingsService {
    constructor(
        private prisma: PrismaService,
        private twilioService: TwilioService,
        private i18nService: I18nService,
    ) { }

    /**
     * Создает новое бронирование
     */
    async createBooking(dto: {
        eventId: string;
        familyId: string;
        participants: number;
        notes?: string;
    }): Promise<any> {
        try {
            // Проверяем доступность события
            const event = await this.prisma.event.findUnique({
                where: { id: dto.eventId },
                include: {
                    bookings: {
                        where: { status: 'CONFIRMED' }
                    }
                }
            });

            if (!event) {
                throw new Error('Event not found');
            }

            if (!event.isActive) {
                throw new Error('Event is not available for booking');
            }

            // Проверяем количество участников
            const currentParticipants = event.bookings.length;
            if (currentParticipants + 1 > event.capacity) {
                throw new Error('Not enough spots available');
            }

            // Создаем бронирование
            const booking = await this.prisma.booking.create({
                data: {
                    eventId: dto.eventId,
                    familyId: dto.familyId,
                    notes: dto.notes,
                    status: 'PENDING'
                },
                include: {
                    event: true,
                    family: true
                }
            });

            // Отправляем подтверждение
            const message = this.i18nService.getTranslationWithParams(
                'booking.created',
                {
                    eventTitle: event.titleEn,
                    date: event.date.toLocaleDateString(),
                    time: event.time
                },
                (booking.family.preferredLanguage as 'EN' | 'PT') || 'PT'
            );

            await this.twilioService.sendMessage(booking.family.phone, message);

            return booking;
        } catch (error) {
            console.error('Failed to create booking:', error);
            throw error;
        }
    }

    /**
     * Подтверждает бронирование
     */
    async confirmBooking(bookingId: string): Promise<any> {
        try {
            const booking = await this.prisma.booking.update({
                where: { id: bookingId },
                data: {
                    status: 'CONFIRMED'
                },
                include: {
                    event: true,
                    family: true
                }
            });

            // Отправляем подтверждение
            const message = this.i18nService.getTranslationWithParams(
                'booking.confirmed',
                {
                    eventTitle: booking.event.titleEn,
                    date: booking.event.date.toLocaleDateString(),
                    time: booking.event.time
                },
                (booking.family.preferredLanguage as 'EN' | 'PT') || 'PT'
            );

            await this.twilioService.sendMessage(booking.family.phone, message);

            return booking;
        } catch (error) {
            console.error('Failed to confirm booking:', error);
            throw error;
        }
    }

    /**
     * Отменяет бронирование
     */
    async cancelBooking(bookingId: string, reason?: string): Promise<any> {
        try {
            const booking = await this.prisma.booking.update({
                where: { id: bookingId },
                data: {
                    status: 'CANCELLED'
                },
                include: {
                    event: true,
                    family: true
                }
            });

            // Отправляем уведомление об отмене
            const message = this.i18nService.getTranslationWithParams(
                'booking.cancelled',
                {
                    eventTitle: booking.event.titleEn,
                    date: booking.event.date.toLocaleDateString(),
                    reason: reason || 'No reason provided'
                },
                (booking.family.preferredLanguage as 'EN' | 'PT') || 'PT'
            );

            await this.twilioService.sendMessage(booking.family.phone, message);

            return booking;
        } catch (error) {
            console.error('Failed to cancel booking:', error);
            throw error;
        }
    }

    /**
     * Получает бронирования семьи
     */
    async getFamilyBookings(familyId: string): Promise<any[]> {
        try {
            return await this.prisma.booking.findMany({
                where: { familyId: familyId },
                include: {
                    event: true
                },
                orderBy: { bookedAt: 'desc' }
            });
        } catch (error) {
            console.error('Failed to get family bookings:', error);
            throw error;
        }
    }

    /**
     * Получает бронирования события
     */
    async getEventBookings(eventId: string): Promise<any[]> {
        try {
            return await this.prisma.booking.findMany({
                where: { eventId: eventId },
                include: {
                    family: {
                        select: { phone: true, preferredLanguage: true, clientCode: true }
                    }
                },
                orderBy: { bookedAt: 'asc' }
            });
        } catch (error) {
            console.error('Failed to get event bookings:', error);
            throw error;
        }
    }

    /**
     * Получает статистику бронирований
     */
    async getBookingStats(): Promise<any> {
        try {
            const [total, confirmed, pending, cancelled] = await Promise.all([
                this.prisma.booking.count(),
                this.prisma.booking.count({ where: { status: 'CONFIRMED' } }),
                this.prisma.booking.count({ where: { status: 'PENDING' } }),
                this.prisma.booking.count({ where: { status: 'CANCELLED' } })
            ]);

            const totalParticipants = await this.prisma.booking.count({
                where: { status: 'CONFIRMED' }
            });

            return {
                total,
                confirmed,
                pending,
                cancelled,
                totalParticipants: totalParticipants,
                confirmationRate: total > 0 ? (confirmed / total) * 100 : 0
            };
        } catch (error) {
            console.error('Failed to get booking stats:', error);
            throw error;
        }
    }

    /**
     * Отправляет напоминание о событии
     */
    async sendEventReminder(eventId: string): Promise<void> {
        try {
            const event = await this.prisma.event.findUnique({
                where: { id: eventId },
                include: {
                    bookings: {
                        where: { status: 'CONFIRMED' },
                        include: {
                            family: true
                        }
                    }
                }
            });

            if (!event) {
                throw new Error('Event not found');
            }

            for (const booking of event.bookings) {
                const message = this.i18nService.getTranslationWithParams(
                    'event.reminder',
                    {
                        eventTitle: event.titleEn,
                        date: event.date.toLocaleDateString(),
                        time: event.time
                    },
                    (booking.family.preferredLanguage as 'EN' | 'PT') || 'PT'
                );

                await this.twilioService.sendMessage(booking.family.phone, message);
            }
        } catch (error) {
            console.error('Failed to send event reminder:', error);
            throw error;
        }
    }
}
