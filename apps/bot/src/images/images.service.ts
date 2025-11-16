import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { createCanvas, loadImage } from 'canvas';

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) { }

  async generateLoyaltyCard(familyId: string, language: 'EN' | 'PT' = 'EN'): Promise<string> {
    try {
      this.logger.log(`Generating loyalty card for family ${familyId} in ${language}`);

      // Get family data
      const family = await this.prisma.family.findUnique({
        where: { id: familyId },
        include: {
          loyaltyCounter: true,
          visits: true,
        },
      });

      if (!family) {
        throw new Error('Family not found');
      }

      // Create canvas
      const canvas = createCanvas(400, 600);
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = '#FF6B35';
      ctx.fillRect(0, 0, 400, 600);

      // Header
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Teddy & Friends', 200, 50);
      ctx.fillText(language === 'EN' ? 'Loyalty Card' : 'Cartão de Fidelidade', 200, 80);

      // Family info
      ctx.font = '16px Arial';
      ctx.fillText(`Client: ${family.clientCode}`, 200, 120);
      ctx.fillText(`${family.kidsCount || 0} ${language === 'EN' ? 'children' : 'crianças'}`, 200, 150);

      // QR Code placeholder
      ctx.fillStyle = '#000000';
      ctx.fillRect(150, 200, 100, 100);

      // Points
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`${family.loyaltyCounter?.currentCycleCount || 0}`, 200, 260);
      ctx.font = '14px Arial';
      ctx.fillText(language === 'EN' ? 'Points' : 'Pontos', 200, 280);

      // Footer
      ctx.font = '12px Arial';
      ctx.fillText(language === 'EN' ? 'Valid until:' : 'Válido até:', 200, 350);
      ctx.fillText(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(), 200, 370);

      // Convert to base64
      const buffer = canvas.toBuffer('image/png');
      const base64 = buffer.toString('base64');

      return `data:image/png;base64,${base64}`;
    } catch (error) {
      this.logger.error(`Failed to generate loyalty card: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async generateVoucher(voucherId: string, language: 'EN' | 'PT' = 'EN'): Promise<string> {
    try {
      this.logger.log(`Generating voucher ${voucherId} in ${language}`);

      // Get voucher data
      const voucher = await this.prisma.voucher.findUnique({
        where: { id: voucherId },
        include: {
          family: true,
        },
      });

      if (!voucher) {
        throw new Error('Voucher not found');
      }

      // Create canvas
      const canvas = createCanvas(400, 600);
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(0, 0, 400, 600);

      // Header
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Teddy & Friends', 200, 50);
      ctx.fillText(language === 'EN' ? 'Voucher' : 'Vale', 200, 80);

      // Voucher info
      ctx.font = '16px Arial';
      ctx.fillText(`Code: ${voucher.code}`, 200, 120);
      ctx.fillText(`Status: ${voucher.status}`, 200, 150);

      // Value (using a default discount since there's no value field)
      ctx.font = 'bold 32px Arial';
      ctx.fillText('10%', 200, 200);
      ctx.font = '14px Arial';
      ctx.fillText(language === 'EN' ? 'Discount' : 'Desconto', 200, 220);

      // QR Code placeholder
      ctx.fillStyle = '#000000';
      ctx.fillRect(150, 250, 100, 100);

      // Expiry
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px Arial';
      ctx.fillText(language === 'EN' ? 'Valid until:' : 'Válido até:', 200, 380);
      ctx.fillText(voucher.validUntil.toLocaleDateString(), 200, 400);

      // Convert to base64
      const buffer = canvas.toBuffer('image/png');
      const base64 = buffer.toString('base64');

      return `data:image/png;base64,${base64}`;
    } catch (error) {
      this.logger.error(`Failed to generate voucher: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}