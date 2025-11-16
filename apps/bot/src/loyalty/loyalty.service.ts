import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TwilioService } from '../twilio/twilio.service';
import { QrService } from '../qr/qr.service';
import { ImagesService } from '../images/images.service';

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly twilioService: TwilioService,
    private readonly qrService: QrService,
    private readonly imagesService: ImagesService,
  ) { }

  /**
   * Обновляет счетчик лояльности после визита
   */
  async updateLoyaltyCounter(familyId: string): Promise<void> {
    try {
      // Находим или создаем счетчик лояльности
      let loyaltyCounter = await this.prisma.loyaltyCounter.findUnique({
        where: { familyId: familyId }
      });

      if (!loyaltyCounter) {
        // Создаем новый счетчик
        loyaltyCounter = await this.prisma.loyaltyCounter.create({
          data: {
            familyId: familyId,
            currentCycleCount: 1,
            totalVisits: 1,
            lastVisitAt: new Date(),
            cycleStartedAt: new Date(),
          }
        });
      } else {
        // Обновляем существующий счетчик
        const newCount = loyaltyCounter.currentCycleCount + 1;
        const newTotal = loyaltyCounter.totalVisits + 1;

        loyaltyCounter = await this.prisma.loyaltyCounter.update({
          where: { familyId: familyId },
          data: {
            currentCycleCount: newCount,
            totalVisits: newTotal,
            lastVisitAt: new Date(),
          }
        });

        // Если достигли 5 визитов, завершаем цикл
        if (newCount >= 5) {
          await this.prisma.loyaltyCounter.update({
            where: { familyId: familyId },
            data: {
              cycleCompletedAt: new Date(),
            }
          });
        }
      }

      this.logger.log(`Updated loyalty counter for family ${familyId}: ${loyaltyCounter.currentCycleCount}/5`);

    } catch (error) {
      this.logger.error(`Failed to update loyalty counter: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Генерирует ваучер при достижении 5 визитов
   */
  async generateVoucher(familyId: string): Promise<void> {
    try {
      const family = await this.prisma.family.findUnique({
        where: { id: familyId },
        include: { loyaltyCounter: true }
      });

      if (!family) {
        this.logger.error(`Family not found: ${familyId}`);
        return;
      }

      // Проверяем, есть ли уже активный ваучер
      const existingVoucher = await this.prisma.voucher.findFirst({
        where: {
          familyId: familyId,
          status: 'ACTIVE'
        }
      });

      if (existingVoucher) {
        this.logger.log(`Family ${family.clientCode} already has an active voucher`);
        return;
      }

      // Генерируем уникальный код ваучера
      const voucherCode = await this.generateVoucherCode();

      // Создаем ваучер (действителен 30 дней)
      const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const voucher = await this.prisma.voucher.create({
        data: {
          familyId: familyId,
          code: voucherCode,
          status: 'ACTIVE',
          validUntil: validUntil,
        }
      });

      // Генерируем QR-код для ваучера
      const qrData = await this.qrService.generateVoucherQR(voucher.id, voucherCode);

      // Обновляем ваучер с QR-данными
      await this.prisma.voucher.update({
        where: { id: voucher.id },
        data: { qrData: qrData }
      });

      // Отправляем уведомление о ваучере
      await this.sendVoucherNotification(familyId, voucherCode, validUntil);

      this.logger.log(`Generated voucher ${voucherCode} for family ${family.clientCode}`);

    } catch (error) {
      this.logger.error(`Failed to generate voucher: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Отправляет уведомление о готовом ваучере
   */
  private async sendVoucherNotification(familyId: string, voucherCode: string, validUntil: Date): Promise<void> {
    try {
      const family = await this.prisma.family.findUnique({
        where: { id: familyId }
      });

      if (!family) {
        this.logger.error(`Family not found: ${familyId}`);
        return;
      }

      const language = family.preferredLanguage as 'EN' | 'PT';
      const validUntilStr = validUntil.toLocaleDateString(language === 'EN' ? 'en-US' : 'pt-PT');

      let message: string;

      if (language === 'EN') {
        message = `🎉 *Congratulations!*

You've completed 5 visits and earned a FREE HOUR voucher!

Voucher Code: ${voucherCode}
Valid until: ${validUntilStr}

Show this QR code at reception to redeem your free hour! 🎁

Thank you for being a loyal customer! 🐻`;
      } else {
        message = `🎉 *Parabéns!*

Completou 5 visitas e ganhou um voucher de 1 HORA GRÁTIS!

Código do Voucher: ${voucherCode}
Válido até: ${validUntilStr}

Mostre este código QR na receção para usar a sua hora grátis! 🎁

Obrigado por ser um cliente fiel! 🐻`;
      }

      await this.twilioService.sendTextMessage(family.phone, message);

      // Отправляем изображение ваучера
      try {
        const voucherImage = await this.imagesService.generateVoucher(familyId, language);
        // Здесь можно отправить изображение через Twilio, если поддерживается
        this.logger.log(`Voucher image generated for family ${family.clientCode}`);
      } catch (imageError) {
        this.logger.error(`Failed to generate voucher image: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`);
      }

    } catch (error) {
      this.logger.error(`Failed to send voucher notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Погашает ваучер
   */
  async redeemVoucher(voucherCode: string, staffId: string): Promise<{ success: boolean; error?: string; voucher?: any }> {
    try {
      const voucher = await this.prisma.voucher.findUnique({
        where: { code: voucherCode },
        include: { family: true }
      });

      if (!voucher) {
        return { success: false, error: 'Voucher not found' };
      }

      if (voucher.status !== 'ACTIVE') {
        return { success: false, error: `Voucher is ${voucher.status}` };
      }

      if (new Date() > voucher.validUntil) {
        // Помечаем как просроченный
        await this.prisma.voucher.update({
          where: { id: voucher.id },
          data: { status: 'EXPIRED' }
        });
        return { success: false, error: 'Voucher has expired' };
      }

      // Погашаем ваучер
      const redeemedVoucher = await this.prisma.voucher.update({
        where: { id: voucher.id },
        data: {
          status: 'REDEEMED',
          redeemedAt: new Date(),
          redeemedByStaffId: staffId
        }
      });

      // Сбрасываем счетчик лояльности для нового цикла
      await this.resetLoyaltyCycle(voucher.familyId);

      this.logger.log(`Voucher ${voucherCode} redeemed by staff ${staffId}`);

      return { success: true, voucher: redeemedVoucher };

    } catch (error) {
      this.logger.error(`Failed to redeem voucher: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, error: 'Internal error' };
    }
  }

  /**
   * Сбрасывает цикл лояльности для нового цикла
   */
  private async resetLoyaltyCycle(familyId: string): Promise<void> {
    try {
      await this.prisma.loyaltyCounter.update({
        where: { familyId: familyId },
        data: {
          currentCycleCount: 0,
          cycleStartedAt: new Date(),
          cycleCompletedAt: null,
        }
      });

      this.logger.log(`Reset loyalty cycle for family ${familyId}`);
    } catch (error) {
      this.logger.error(`Failed to reset loyalty cycle: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Получает статус лояльности семьи
   */
  async getLoyaltyStatus(familyId: string): Promise<any> {
    try {
      const family = await this.prisma.family.findUnique({
        where: { id: familyId },
        include: {
          loyaltyCounter: true,
          vouchers: {
            where: { status: 'ACTIVE' },
            orderBy: { issuedAt: 'desc' }
          }
        }
      });

      if (!family) {
        return null;
      }

      const currentCount = family.loyaltyCounter?.currentCycleCount || 0;
      const totalVisits = family.loyaltyCounter?.totalVisits || 0;
      const remaining = 5 - currentCount;

      return {
        familyId: family.id,
        clientCode: family.clientCode,
        currentCycleCount: currentCount,
        totalVisits: totalVisits,
        remainingVisits: remaining,
        hasActiveVoucher: family.vouchers.length > 0,
        activeVouchers: family.vouchers,
        lastVisitAt: family.loyaltyCounter?.lastVisitAt,
        cycleStartedAt: family.loyaltyCounter?.cycleStartedAt,
      };

    } catch (error) {
      this.logger.error(`Failed to get loyalty status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Отправляет карточку лояльности
   */
  async sendLoyaltyCard(familyId: string): Promise<void> {
    try {
      const family = await this.prisma.family.findUnique({
        where: { id: familyId },
        include: {
          loyaltyCounter: true
        }
      });

      if (!family) {
        this.logger.error(`Family not found: ${familyId}`);
        return;
      }

      const language = family.preferredLanguage as 'EN' | 'PT';

      let message: string;

      if (language === 'EN') {
        message = `🎟 *Your Loyalty Card*

Visit us 5 times to earn 1 FREE HOUR!

Your current progress: ${family.loyaltyCounter?.currentCycleCount || 0}/5 visits

Keep visiting to earn your free hour! 🐻`;
      } else {
        message = `🎟 *O Seu Cartão de Fidelidade*

Visite-nos 5 vezes para ganhar 1 HORA GRÁTIS!

O seu progresso atual: ${family.loyaltyCounter?.currentCycleCount || 0}/5 visitas

Continue a visitar para ganhar a sua hora grátis! 🐻`;
      }

      await this.twilioService.sendTextMessage(family.phone, message);

      // Отправляем изображение карточки лояльности
      try {
        const loyaltyCardImage = await this.imagesService.generateLoyaltyCard(familyId, language);
        this.logger.log(`Loyalty card image generated for family ${family.clientCode}`);
      } catch (imageError) {
        this.logger.error(`Failed to generate loyalty card image: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`);
      }

    } catch (error) {
      this.logger.error(`Failed to send loyalty card: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Генерирует уникальный код ваучера
   */
  private async generateVoucherCode(): Promise<string> {
    let voucherCode: string;
    let isUnique = false;
    let counter = 1;

    while (!isUnique) {
      voucherCode = `V${counter.toString().padStart(6, '0')}`;

      const existing = await this.prisma.voucher.findUnique({
        where: { code: voucherCode }
      });

      if (!existing) {
        isUnique = true;
      } else {
        counter++;
      }
    }

    return voucherCode!;
  }

  /**
   * Получает статистику лояльности
   */
  async getLoyaltyStats(): Promise<any> {
    try {
      const totalFamilies = await this.prisma.family.count();
      const familiesWithLoyalty = await this.prisma.loyaltyCounter.count();
      const activeVouchers = await this.prisma.voucher.count({
        where: { status: 'ACTIVE' }
      });
      const redeemedVouchers = await this.prisma.voucher.count({
        where: { status: 'REDEEMED' }
      });

      const loyaltyDistribution = await this.prisma.loyaltyCounter.groupBy({
        by: ['currentCycleCount'],
        _count: { currentCycleCount: true }
      });

      return {
        totalFamilies,
        familiesWithLoyalty,
        activeVouchers,
        redeemedVouchers,
        loyaltyDistribution
      };
    } catch (error) {
      this.logger.error(`Failed to get loyalty stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { totalFamilies: 0, familiesWithLoyalty: 0, activeVouchers: 0, redeemedVouchers: 0, loyaltyDistribution: [] };
    }
  }
}