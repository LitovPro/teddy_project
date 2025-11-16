import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TwilioService } from '../twilio/twilio.service';
import { I18nService } from '../i18n/i18n.service';

@Injectable()
export class DataDeletionService {
    constructor(
        private prisma: PrismaService,
        private twilioService: TwilioService,
        private i18nService: I18nService,
    ) { }

    /**
     * Запрашивает удаление данных семьи
     */
    async requestDataDeletion(familyId: string, reason?: string): Promise<any> {
        try {
            const family = await this.prisma.family.findUnique({
                where: { id: familyId }
            });

            if (!family) {
                throw new Error('Family not found');
            }

            // Создаем запрос на удаление данных
            const deletionRequest = await this.prisma.dataDeletionRequest.create({
                data: {
                    familyId: familyId,
                    reason: reason || 'User requested data deletion',
                    status: 'PENDING',
                    requestedAt: new Date()
                }
            });

            // Отправляем подтверждение запроса
            const message = this.i18nService.getTranslationWithParams(
                'data_deletion.requested',
                {
                    requestId: deletionRequest.id
                },
                (family.preferredLanguage as 'EN' | 'PT') || 'PT'
            );

            await this.twilioService.sendMessage(family.phone, message);

            return deletionRequest;
        } catch (error) {
            console.error('Failed to request data deletion:', error);
            throw error;
        }
    }

    /**
     * Выполняет удаление данных семьи
     */
    async executeDataDeletion(familyId: string, staffId: string): Promise<any> {
        try {
            const family = await this.prisma.family.findUnique({
                where: { id: familyId },
                include: {
                    consent: true,
                    loyaltyCounter: true,
                    vouchers: true,
                    visits: true,
                    orders: true,
                    bookings: true,
                    subscriptions: true
                }
            });

            if (!family) {
                throw new Error('Family not found');
            }

            // Анонимизируем данные вместо полного удаления (GDPR best practice)
            const anonymizedData = {
                phone: `ANONYMIZED_${Date.now()}`,
                kidsCount: 0,
                clientCode: `DELETED_${Date.now()}`,
                consentMarketing: false,
                consentGdpr: false,
                lastActiveAt: new Date(),
                // Сохраняем только необходимые данные для аудита
                deletedAt: new Date(),
                deletedBy: staffId
            };

            // Обновляем семейную запись
            await this.prisma.family.update({
                where: { id: familyId },
                data: anonymizedData
            });

            // Удаляем связанные данные
            await Promise.all([
                this.prisma.consent.deleteMany({ where: { familyId: familyId } }),
                this.prisma.loyaltyCounter.deleteMany({ where: { familyId: familyId } }),
                this.prisma.voucher.deleteMany({ where: { familyId: familyId } }),
                this.prisma.visit.deleteMany({ where: { familyId: familyId } }),
                this.prisma.order.deleteMany({ where: { familyId: familyId } }),
                this.prisma.booking.deleteMany({ where: { familyId: familyId } }),
                this.prisma.subscription.deleteMany({ where: { familyId: familyId } })
            ]);

            // Обновляем статус запроса на удаление
            await this.prisma.dataDeletionRequest.updateMany({
                where: { familyId: familyId, status: 'PENDING' },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    completedBy: staffId
                }
            });

            return {
                familyId,
                deletedAt: new Date(),
                deletedBy: staffId,
                message: 'Data successfully anonymized and deleted'
            };
        } catch (error) {
            console.error('Failed to execute data deletion:', error);
            throw error;
        }
    }

    /**
     * Экспортирует данные семьи
     */
    async exportFamilyData(familyId: string): Promise<any> {
        try {
            const family = await this.prisma.family.findUnique({
                where: { id: familyId },
                include: {
                    consent: true,
                    loyaltyCounter: true,
                    vouchers: true,
                    visits: true,
                    orders: {
                        include: {
                            orderItems: true
                        }
                    },
                    bookings: {
                        include: {
                            event: true
                        }
                    },
                    subscriptions: true
                }
            });

            if (!family) {
                throw new Error('Family not found');
            }

            // Создаем запись об экспорте
            const exportRecord = await this.prisma.dataExport.create({
                data: {
                    familyId: familyId,
                    status: 'completed',
                    filePath: `exports/${familyId}_${Date.now()}.json`,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
                }
            });

            // Отправляем уведомление
            const message = this.i18nService.getTranslationWithParams(
                'data_export.completed',
                {
                    exportId: exportRecord.id
                },
                (family.preferredLanguage as 'EN' | 'PT') || 'PT'
            );

            await this.twilioService.sendMessage(family.phone, message);

            return {
                exportId: exportRecord.id,
                data: family,
                exportedAt: new Date()
            };
        } catch (error) {
            console.error('Failed to export family data:', error);
            throw error;
        }
    }

    /**
     * Получает запросы на удаление данных
     */
    async getDeletionRequests(): Promise<any[]> {
        try {
            return await this.prisma.dataDeletionRequest.findMany({
                orderBy: { requestedAt: 'desc' },
                include: {
                    family: {
                        select: { phone: true, clientCode: true }
                    }
                }
            });
        } catch (error) {
            console.error('Failed to get deletion requests:', error);
            throw error;
        }
    }

    /**
     * Получает статистику GDPR
     */
    async getGdprStats(): Promise<any> {
        try {
            const [totalFamilies, consentGiven, deletionRequests, dataExports] = await Promise.all([
                this.prisma.family.count(),
                this.prisma.consent.count({ where: { type: 'gdpr', granted: true } }),
                this.prisma.dataDeletionRequest.count(),
                this.prisma.dataExport.count()
            ]);

            const pendingDeletions = await this.prisma.dataDeletionRequest.count({
                where: { status: 'PENDING' }
            });

            return {
                totalFamilies,
                consentGiven,
                consentRate: totalFamilies > 0 ? (consentGiven / totalFamilies) * 100 : 0,
                deletionRequests,
                pendingDeletions,
                dataExports,
                complianceRate: totalFamilies > 0 ? ((consentGiven - pendingDeletions) / totalFamilies) * 100 : 0
            };
        } catch (error) {
            console.error('Failed to get GDPR stats:', error);
            throw error;
        }
    }
}
