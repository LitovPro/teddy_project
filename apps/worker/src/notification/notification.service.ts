import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { t } from '@teddy/shared';
import type { Language } from '@teddy/shared';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) { }

    async sendBroadcast(data: {
        templateName: string;
        language: Language;
        audience: 'ALL' | 'SUBSCRIBERS_EVENTS' | 'SUBSCRIBERS_PROMOS';
        variables?: Record<string, string>;
    }): Promise<string> {
        const { templateName, language, audience, variables } = data;

        this.logger.log(`Sending broadcast: ${templateName} to ${audience}`);

        // Get target families based on audience
        let families;
        switch (audience) {
            case 'ALL':
                families = await this.prisma.family.findMany({
                    where: { lang: language },
                });
                break;
            case 'SUBSCRIBERS_EVENTS':
                families = await this.prisma.family.findMany({
                    where: {
                        lang: language,
                        subscriptions: {
                            some: {
                                topic: 'EVENTS',
                                status: 'ON',
                            },
                        },
                    },
                });
                break;
            case 'SUBSCRIBERS_PROMOS':
                families = await this.prisma.family.findMany({
                    where: {
                        lang: language,
                        subscriptions: {
                            some: {
                                topic: 'PROMOS',
                                status: 'ON',
                            },
                        },
                    },
                });
                break;
            default:
                throw new Error(`Unknown audience: ${audience}`);
        }

        this.logger.log(`Found ${families.length} families to notify`);

        // Mock WhatsApp sending (in real implementation, this would use WABA API)
        for (const family of families) {
            if (family.waId) {
                const message = this.buildMessage(templateName, language, variables);
                this.logger.log(`Would send to ${family.waId}: ${message}`);

                // TODO: Implement actual WhatsApp sending via WABA API
                // await this.wabaService.sendMessage(family.waId, message);
            }
        }

        return `Broadcast sent to ${families.length} families`;
    }

    async sendVisitConfirmation(data: {
        familyId: string;
        currentVisits: number;
        targetVisits: number;
        lang: Language;
    }): Promise<string> {
        const { familyId, currentVisits, targetVisits, lang } = data;

        this.logger.log(`Sending visit confirmation to family ${familyId}`);

        const family = await this.prisma.family.findUnique({
            where: { id: familyId },
        });

        if (!family || !family.waId) {
            throw new Error(`Family ${familyId} not found or has no WhatsApp ID`);
        }

        const message = t('notifications.visitConfirmation', lang, {
            current: currentVisits.toString(),
            target: targetVisits.toString(),
            remaining: (targetVisits - currentVisits).toString(),
        });

        this.logger.log(`Would send visit confirmation to ${family.waId}: ${message}`);

        // TODO: Implement actual WhatsApp sending
        // await this.wabaService.sendMessage(family.waId, message);

        return `Visit confirmation sent to ${family.clientCode}`;
    }

    async sendVoucherIssued(data: {
        familyId: string;
        voucherCode: string;
        validUntil: Date;
        lang: Language;
    }): Promise<string> {
        const { familyId, voucherCode, validUntil, lang } = data;

        this.logger.log(`Sending voucher notification to family ${familyId}`);

        const family = await this.prisma.family.findUnique({
            where: { id: familyId },
        });

        if (!family || !family.waId) {
            throw new Error(`Family ${familyId} not found or has no WhatsApp ID`);
        }

        const message = t('notifications.voucherIssued', lang, {
            code: voucherCode,
            validUntil: validUntil.toLocaleDateString(),
        });

        this.logger.log(`Would send voucher notification to ${family.waId}: ${message}`);

        // TODO: Implement actual WhatsApp sending
        // await this.wabaService.sendMessage(family.waId, message);

        return `Voucher notification sent to ${family.clientCode}`;
    }

    private buildMessage(templateName: string, lang: Language, variables?: Record<string, string>): string {
        // This would typically load from a template system
        // For now, return a simple message
        return t(`templates.${templateName}`, lang, variables);
    }
}
