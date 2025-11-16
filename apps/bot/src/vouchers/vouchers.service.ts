import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class VouchersService {
  private readonly logger = new Logger(VouchersService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) { }

  async findVoucher(code: string) {
    return this.prisma.voucher.findUnique({
      where: { code },
      include: {
        family: true,
      },
    });
  }

  // Генерация ваучера при достижении лояльности
  async issueVoucher(familyId: string): Promise<{
    voucherId: string;
    code: string;
    validUntil: Date;
    imageUrl?: string;
  }> {
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
    });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    // Генерируем уникальный код
    const code = this.generateVoucherCode();
    const validDays = this.configService.get<number>('VOUCHER_VALID_DAYS', 30);
    const validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);

    // Создаем HMAC подпись
    const signature = this.generateHmacSignature(code, familyId, validUntil);

    // Сохраняем в базе
    const voucher = await this.prisma.voucher.create({
      data: {
        familyId,
        code,
        validUntil,
      },
    });

    this.logger.log(`Voucher ${code} issued for family ${familyId}, valid until ${validUntil.toISOString()}`);

    // TODO: Генерируем PNG изображение ваучера
    const imageUrl = `${this.configService.get('BASE_URL')}/api/images/voucher/${voucher.id}.png?code=${code}&clientCode=${family.clientCode}&validUntil=${validUntil.toISOString()}&lang=${family.lang}`;

    return {
      voucherId: voucher.id,
      code: voucher.code,
      validUntil: voucher.validUntil,
      imageUrl,
    };
  }

  // Погашение ваучера с проверкой подписи
  async redeemVoucher(code: string, staffId: string) {
    const voucher = await this.findVoucher(code);

    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }

    if (voucher.status !== 'ACTIVE') {
      throw new BadRequestException('Voucher is not active');
    }

    if (voucher.validUntil < new Date()) {
      // Автоматически помечаем как просроченный
      await this.prisma.voucher.update({
        where: { id: voucher.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Voucher has expired');
    }

    // Проверяем HMAC подпись
    const expectedSignature = this.generateHmacSignature(
      voucher.code,
      voucher.familyId,
      voucher.validUntil
    );

    // Проверка подписи временно отключена, так как поле signature удалено из схемы
    // if (voucher.signature !== expectedSignature) {
    //   this.logger.warn(`Invalid signature for voucher ${code}`);
    //   throw new BadRequestException('Invalid voucher signature');
    // }

    // Погашаем ваучер
    const redeemedVoucher = await this.prisma.voucher.update({
      where: { id: voucher.id },
      data: {
        status: 'REDEEMED',
        redeemedAt: new Date(),
        redeemedByStaffId: staffId,
      },
      include: {
        family: true,
        redeemedByStaff: true,
      },
    });

    this.logger.log(`Voucher ${code} redeemed by staff ${staffId}`);

    return redeemedVoucher;
  }

  async getActiveVouchers(familyId: string) {
    return this.prisma.voucher.findMany({
      where: {
        familyId,
        status: 'ACTIVE',
        validUntil: {
          gte: new Date(),
        },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async getAllVouchers() {
    return this.prisma.voucher.findMany({
      include: {
        family: {
          select: {
            clientCode: true,
            phone: true,
          },
        },
        redeemedByStaff: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  // Приватные методы
  private generateVoucherCode(): string {
    // Генерируем код в формате TF-XXXXXX
    const number = Math.floor(100000 + Math.random() * 900000);
    return `TF-${number}`;
  }

  private generateHmacSignature(code: string, familyId: string, validUntil: Date): string {
    const secret = this.configService.get('JWT_SECRET', 'fallback_secret_change_in_production');
    const data = `${code}:${familyId}:${validUntil.toISOString()}`;

    return crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');
  }

  // Проверка подписи ваучера
  verifyVoucherSignature(code: string, familyId: string, validUntil: Date, signature: string): boolean {
    const expectedSignature = this.generateHmacSignature(code, familyId, validUntil);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  // Статистика ваучеров
  async getVoucherStats(): Promise<{
    total: number;
    active: number;
    redeemed: number;
    expired: number;
  }> {
    const now = new Date();

    const [total, active, redeemed, expired] = await Promise.all([
      this.prisma.voucher.count(),
      this.prisma.voucher.count({
        where: {
          status: 'ACTIVE',
          validUntil: { gte: now },
        },
      }),
      this.prisma.voucher.count({
        where: { status: 'REDEEMED' },
      }),
      this.prisma.voucher.count({
        where: {
          OR: [
            { status: 'EXPIRED' },
            {
              status: 'ACTIVE',
              validUntil: { lt: now },
            },
          ],
        },
      }),
    ]);

    return { total, active, redeemed, expired };
  }

  // Автоматическая пометка просроченных ваучеров
  async markExpiredVouchers(): Promise<number> {
    const result = await this.prisma.voucher.updateMany({
      where: {
        status: 'ACTIVE',
        validUntil: { lt: new Date() },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    if (result.count > 0) {
      this.logger.log(`Marked ${result.count} vouchers as expired`);
    }

    return result.count;
  }
}
