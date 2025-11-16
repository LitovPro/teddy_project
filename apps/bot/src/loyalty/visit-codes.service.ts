import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import type { IssueCodeDtoType, ConfirmVisitDtoType } from '@teddy/shared';

@Injectable()
export class VisitCodesService {
  private readonly logger = new Logger(VisitCodesService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) { }

  // Генерация одноразового кода для семьи
  async issueCode(dto: IssueCodeDtoType, staffId?: string): Promise<{ code: string; expiresAt: Date }> {
    const { familyId, ttlMinutes = 10 } = dto;

    // Проверяем, что семья существует
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
    });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    // Деактивируем все старые коды для этой семьи
    await this.prisma.visitCode.updateMany({
      where: {
        familyId,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });

    // Генерируем новый код
    const code = this.generateVisitCode();
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    // Сохраняем в базе
    const visitCode = await this.prisma.visitCode.create({
      data: {
        familyId,
        code,
        staffId,
        expiresAt,
      },
    });

    this.logger.log(`Generated visit code ${code} for family ${familyId}, expires at ${expiresAt.toISOString()}`);

    return {
      code: visitCode.code,
      expiresAt: visitCode.expiresAt,
    };
  }

  // Подтверждение кода и создание визита
  async confirmCode(dto: ConfirmVisitDtoType): Promise<{
    visitId: string;
    familyId: string;
    loyaltyProgress: {
      current: number;
      target: number;
      percentage: number;
    };
    voucherIssued?: {
      voucherId: string;
      code: string;
    };
  }> {
    const { code, staffId, source = 'CODE', note } = dto;

    // Ищем активный код
    const visitCode = await this.prisma.visitCode.findUnique({
      where: { code },
      include: {
        family: {
          include: {
            loyaltyCounter: true,
          },
        },
      },
    });

    if (!visitCode) {
      throw new BadRequestException('Invalid visit code');
    }

    if (visitCode.isUsed) {
      throw new BadRequestException('Visit code already used');
    }

    if (visitCode.expiresAt < new Date()) {
      throw new BadRequestException('Visit code expired');
    }

    // Проверяем на дубли визитов (анти-фрод)
    const recentVisit = await this.prisma.visit.findFirst({
      where: {
        familyId: visitCode.familyId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // последние 30 минут
        },
      },
    });

    if (recentVisit) {
      throw new BadRequestException('Visit already recorded recently. Please wait 30 minutes between visits.');
    }

    // Начинаем транзакцию
    const result = await this.prisma.$transaction(async (tx) => {
      // Отмечаем код как использованный
      await tx.visitCode.update({
        where: { id: visitCode.id },
        data: {
          isUsed: true,
          usedAt: new Date(),
        },
      });

      // Создаем визит
      const visit = await tx.visit.create({
        data: {
          familyId: visitCode.familyId,
          source,
          staffId,
          note,
        },
      });

      // Обновляем счетчик лояльности
      const loyaltyCounter = await tx.loyaltyCounter.upsert({
        where: { familyId: visitCode.familyId },
        create: {
          familyId: visitCode.familyId,
          currentCycleCount: 1,
          totalVisits: 1,
        },
        update: {
          currentCycleCount: { increment: 1 },
          totalVisits: { increment: 1 },
        },
      });

      const loyaltyTarget = this.configService.get<number>('LOYALTY_TARGET', 5);
      let voucherIssued;

      // Проверяем, нужно ли выдать ваучер
      if (loyaltyCounter.currentCycleCount >= loyaltyTarget) {
        // Выдаем ваучер и сбрасываем счетчик
        const voucher = await tx.voucher.create({
          data: {
            familyId: visitCode.familyId,
            code: this.generateVoucherCode(),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
            qrData: this.generateVoucherSignature(visitCode.familyId),
          },
        });

        // Сбрасываем счетчик
        await tx.loyaltyCounter.update({
          where: { familyId: visitCode.familyId },
          data: {
            currentCycleCount: 0,
          },
        });

        voucherIssued = {
          voucherId: voucher.id,
          code: voucher.code,
        };

        this.logger.log(`Voucher ${voucher.code} issued for family ${visitCode.familyId}`);
      }

      return {
        visitId: visit.id,
        familyId: visitCode.familyId,
        loyaltyProgress: {
          current: loyaltyCounter.currentCycleCount >= loyaltyTarget ? loyaltyTarget : loyaltyCounter.currentCycleCount,
          target: loyaltyTarget,
          percentage: Math.round((loyaltyCounter.currentCycleCount / loyaltyTarget) * 100),
        },
        voucherIssued,
      };
    });

    this.logger.log(`Visit confirmed for family ${visitCode.familyId}, code ${code}`);

    return result;
  }

  // Получить активные коды для семьи
  async getActiveCodes(familyId: string): Promise<Array<{
    code: string;
    expiresAt: Date;
    createdAt: Date;
  }>> {
    const codes = await this.prisma.visitCode.findMany({
      where: {
        familyId,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      select: {
        code: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return codes;
  }

  // Очистка просроченных кодов (можно вызывать по cron)
  async cleanupExpiredCodes(): Promise<number> {
    const result = await this.prisma.visitCode.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          {
            isUsed: true,
            usedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // удаляем использованные коды старше суток
          },
        ],
      },
    });

    if (result.count > 0) {
      this.logger.log(`Cleaned up ${result.count} expired visit codes`);
    }

    return result.count;
  }

  // Статистика кодов
  async getCodesStats(): Promise<{
    total: number;
    active: number;
    used: number;
    expired: number;
  }> {
    const now = new Date();

    const [total, active, used, expired] = await Promise.all([
      this.prisma.visitCode.count(),
      this.prisma.visitCode.count({
        where: {
          isUsed: false,
          expiresAt: { gt: now },
        },
      }),
      this.prisma.visitCode.count({
        where: { isUsed: true },
      }),
      this.prisma.visitCode.count({
        where: {
          isUsed: false,
          expiresAt: { lt: now },
        },
      }),
    ]);

    return { total, active, used, expired };
  }

  // Приватные методы
  private generateVisitCode(): string {
    // Генерируем 6-значный код
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateVoucherCode(): string {
    // Генерируем код ваучера в формате TF-XXXXXX
    const number = Math.floor(100000 + Math.random() * 900000);
    return `TF-${number}`;
  }

  private generateVoucherSignature(familyId: string): string {
    // TODO: Реализовать HMAC подпись
    // Пока возвращаем простую подпись
    return Buffer.from(`${familyId}-${Date.now()}`).toString('base64');
  }
}
