import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TwilioService } from '../twilio/twilio.service';
import { QrService } from '../qr/qr.service';
import { LoyaltyService } from '../loyalty/loyalty.service';

@Injectable()
export class VisitsService {
    private readonly logger = new Logger(VisitsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly twilioService: TwilioService,
        private readonly qrService: QrService,
        private readonly loyaltyService: LoyaltyService,
    ) { }

    /**
     * Генерирует одноразовый код для визита
     */
    async generateVisitCode(familyId: string): Promise<string> {
        try {
            // Генерируем 6-значный код
            const code = Math.floor(100000 + Math.random() * 900000).toString();

            // Проверяем уникальность
            const existingCode = await this.prisma.visitCode.findUnique({
                where: { code: code }
            });

            if (existingCode) {
                // Если код уже существует, генерируем новый
                return this.generateVisitCode(familyId);
            }

            // Создаем код с TTL 10 минут
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

            await this.prisma.visitCode.create({
                data: {
                    code: code,
                    familyId: familyId,
                    expiresAt: expiresAt,
                }
            });

            this.logger.log(`Generated visit code ${code} for family ${familyId}`);
            return code;

        } catch (error) {
            this.logger.error(`Failed to generate visit code: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    /**
     * Валидирует и засчитывает визит по коду
     */
    async validateVisitCode(code: string, staffId?: string): Promise<{ success: boolean; familyId?: string; clientCode?: string; error?: string }> {
        try {
            // Находим код
            const visitCode = await this.prisma.visitCode.findUnique({
                where: { code: code },
                include: { family: true }
            });

            if (!visitCode) {
                return { success: false, error: 'Invalid visit code' };
            }

            // Проверяем, не использован ли уже
            if (visitCode.isUsed) {
                return { success: false, error: 'Visit code already used' };
            }

            // Проверяем срок действия
            if (new Date() > visitCode.expiresAt) {
                return { success: false, error: 'Visit code expired' };
            }

            // Засчитываем визит
            await this.recordVisit(visitCode.familyId, 'code', staffId, code);

            // Помечаем код как использованный
            await this.prisma.visitCode.update({
                where: { id: visitCode.id },
                data: { isUsed: true }
            });

            this.logger.log(`Visit recorded for family ${visitCode.family.clientCode} using code ${code}`);

            return {
                success: true,
                familyId: visitCode.familyId,
                clientCode: visitCode.family.clientCode
            };

        } catch (error) {
            this.logger.error(`Failed to validate visit code: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { success: false, error: 'Internal error' };
        }
    }

    /**
     * Валидирует и засчитывает визит по QR-коду семьи
     */
    async validateFamilyQR(qrData: string, staffId?: string): Promise<{ success: boolean; familyId?: string; clientCode?: string; error?: string }> {
        try {
            // Валидируем QR-код
            const validation = this.qrService.validateFamilyQR(qrData);

            if (!validation.isValid) {
                return { success: false, error: validation.error };
            }

            // Засчитываем визит
            await this.recordVisit(validation.familyId!, 'qr', staffId, qrData);

            this.logger.log(`Visit recorded for family ${validation.clientCode} using QR`);

            return {
                success: true,
                familyId: validation.familyId,
                clientCode: validation.clientCode
            };

        } catch (error) {
            this.logger.error(`Failed to validate family QR: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { success: false, error: 'Internal error' };
        }
    }

    /**
     * Засчитывает визит вручную (для администратора)
     */
    async recordManualVisit(familyId: string, staffId: string): Promise<{ success: boolean; error?: string }> {
        try {
            await this.recordVisit(familyId, 'manual', staffId);

            this.logger.log(`Manual visit recorded for family ${familyId} by staff ${staffId}`);

            return { success: true };

        } catch (error) {
            this.logger.error(`Failed to record manual visit: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { success: false, error: 'Internal error' };
        }
    }

    /**
     * Записывает визит в базу данных
     */
    private async recordVisit(familyId: string, source: 'code' | 'qr' | 'manual', staffId?: string, sourceData?: string): Promise<void> {
        try {
            // Создаем запись о визите
            const visit = await this.prisma.visit.create({
                data: {
                    familyId: familyId,
                    source: source.toUpperCase() as any, // Преобразуем в enum
                    staffId: staffId,
                    sourceData: sourceData,
                    validatedAt: new Date(),
                    isValidated: true,
                }
            });

            // Обновляем счетчик лояльности
            await this.loyaltyService.updateLoyaltyCounter(familyId);

            // Отправляем уведомление о визите
            await this.sendVisitConfirmation(familyId);

            this.logger.log(`Visit ${visit.id} recorded for family ${familyId}`);

        } catch (error) {
            this.logger.error(`Failed to record visit: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    /**
     * Отправляет подтверждение о засчитанном визите
     */
    private async sendVisitConfirmation(familyId: string): Promise<void> {
        try {
            const family = await this.prisma.family.findUnique({
                where: { id: familyId },
                include: { loyaltyCounter: true }
            });

            if (!family) {
                this.logger.error(`Family not found: ${familyId}`);
                return;
            }

            const language = family.preferredLanguage as 'EN' | 'PT';
            const currentCount = family.loyaltyCounter?.currentCycleCount || 0;
            const remaining = 5 - currentCount;

            let message: string;

            if (language === 'EN') {
                message = `✅ *Visit recorded!*

Your loyalty progress: ${currentCount}/5 visits
${remaining > 0 ? `${remaining} more visits to earn your free hour!` : '🎉 You\'ve earned a FREE HOUR voucher!'}

Thank you for visiting Teddy & Friends! 🐻`;
            } else {
                message = `✅ *Visita registada!*

O seu progresso de fidelidade: ${currentCount}/5 visitas
${remaining > 0 ? `${remaining} mais visitas para ganhar a sua hora grátis!` : '🎉 Ganhou um voucher de 1 HORA GRÁTIS!'}

Obrigado por visitar o Teddy & Friends! 🐻`;
            }

            await this.twilioService.sendTextMessage(family.phone, message);

            // Если достигли 5 визитов, отправляем ваучер
            if (currentCount >= 5) {
                await this.loyaltyService.generateVoucher(familyId);
            }

        } catch (error) {
            this.logger.error(`Failed to send visit confirmation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Получает историю визитов семьи
     */
    async getFamilyVisits(familyId: string, limit: number = 10): Promise<any[]> {
        try {
            const visits = await this.prisma.visit.findMany({
                where: { familyId: familyId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                include: {
                    staff: {
                        select: { name: true }
                    }
                }
            });

            return visits;
        } catch (error) {
            this.logger.error(`Failed to get family visits: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return [];
        }
    }

    /**
     * Получает статистику визитов
     */
    async getVisitStats(dateFrom?: Date, dateTo?: Date): Promise<any> {
        try {
            const whereClause: any = {};

            if (dateFrom || dateTo) {
                whereClause.createdAt = {};
                if (dateFrom) whereClause.createdAt.gte = dateFrom;
                if (dateTo) whereClause.createdAt.lte = dateTo;
            }

            const totalVisits = await this.prisma.visit.count({
                where: whereClause
            });

            const visitsBySource = await this.prisma.visit.groupBy({
                by: ['source'],
                where: whereClause,
                _count: { source: true }
            });

            const visitsByDay = await this.prisma.visit.groupBy({
                by: ['createdAt'],
                where: whereClause,
                _count: { createdAt: true }
            });

            return {
                totalVisits,
                visitsBySource,
                visitsByDay
            };
        } catch (error) {
            this.logger.error(`Failed to get visit stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { totalVisits: 0, visitsBySource: [], visitsByDay: [] };
        }
    }

    /**
     * Очищает просроченные коды визитов
     */
    async cleanupExpiredCodes(): Promise<void> {
        try {
            const deleted = await this.prisma.visitCode.deleteMany({
                where: {
                    expiresAt: {
                        lt: new Date()
                    }
                }
            });

            this.logger.log(`Cleaned up ${deleted.count} expired visit codes`);
        } catch (error) {
            this.logger.error(`Failed to cleanup expired codes: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
