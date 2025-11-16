import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCanvas, loadImage, registerFont } from 'canvas';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { t } from '@teddy/shared';
import type { Language } from '@teddy/shared';

@Injectable()
export class ImageProcessorService {
    private readonly logger = new Logger(ImageProcessorService.name);
    private readonly storagePath: string;

    constructor(private configService: ConfigService) {
        this.storagePath = process.cwd();

        // Register fonts if available
        try {
            registerFont(join(process.cwd(), 'assets/fonts/Roboto-Regular.ttf'), { family: 'Roboto' });
            registerFont(join(process.cwd(), 'assets/fonts/Roboto-Bold.ttf'), { family: 'Roboto', weight: 'bold' });
        } catch (error) {
            this.logger.warn('Could not load custom fonts, using system defaults');
        }
    }

    async generateLoyaltyCard(data: {
        familyId: string;
        clientCode: string;
        current: number;
        target: number;
        lang: Language;
    }): Promise<string> {
        const { familyId, clientCode, current, target, lang } = data;

        this.logger.log(`Generating loyalty card for ${clientCode} (${current}/${target})`);

        const canvas = createCanvas(1200, 628);
        const ctx = canvas.getContext('2d');

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 1200, 628);
        gradient.addColorStop(0, '#FF6B35'); // Orange
        gradient.addColorStop(1, '#F7931E'); // Yellow
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 628);

        // Brand name
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Roboto, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.configService.get('BRAND_NAME', 'Teddy & Friends'), 600, 100);

        // Card title
        ctx.font = '32px Roboto, Arial, sans-serif';
        ctx.fillText(t('loyalty.card.title', lang), 600, 180);

        // Client code
        ctx.font = 'bold 28px Roboto, Arial, sans-serif';
        ctx.fillText(clientCode, 600, 250);

        // Progress bar background
        const barX = 200;
        const barY = 320;
        const barWidth = 800;
        const barHeight = 40;
        const radius = 20;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.roundRect(ctx, barX, barY, barWidth, barHeight, radius);
        ctx.fill();

        // Progress bar fill
        const progress = Math.min(current / target, 1);
        const fillWidth = barWidth * progress;

        ctx.fillStyle = '#4CAF50'; // Green
        this.roundRect(ctx, barX, barY, fillWidth, barHeight, radius);
        ctx.fill();

        // Progress text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Roboto, Arial, sans-serif';
        ctx.fillText(`${current}/${target} ${t('loyalty.card.visits', lang)}`, 600, 350);

        // Reward text
        if (current >= target) {
            ctx.fillStyle = '#FFD700'; // Gold
            ctx.font = 'bold 36px Roboto, Arial, sans-serif';
            ctx.fillText(t('loyalty.card.reward', lang), 600, 450);
        } else {
            const remaining = target - current;
            ctx.fillStyle = 'white';
            ctx.font = '24px Roboto, Arial, sans-serif';
            ctx.fillText(t('loyalty.card.remaining', lang, { count: remaining.toString() }), 600, 450);
        }

        // Footer
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '18px Roboto, Arial, sans-serif';
        ctx.fillText(t('loyalty.card.footer', lang), 600, 550);

        // Save image
        const filename = `loyalty-${familyId}-${Date.now()}.png`;
        const filepath = join(this.storagePath, 'storage', 'cards', filename);

        await mkdir(dirname(filepath), { recursive: true });
        await writeFile(filepath, canvas.toBuffer('image/png'));

        this.logger.log(`Loyalty card saved: ${filepath}`);
        return `/storage/cards/${filename}`;
    }

    async generateVoucher(data: {
        voucherId: string;
        code: string;
        clientCode: string;
        validUntil: Date;
        lang: Language;
    }): Promise<string> {
        const { voucherId, code, clientCode, validUntil, lang } = data;

        this.logger.log(`Generating voucher for ${clientCode} (${code})`);

        const canvas = createCanvas(1200, 628);
        const ctx = canvas.getContext('2d');

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 1200, 628);
        gradient.addColorStop(0, '#4CAF50'); // Green
        gradient.addColorStop(1, '#2E7D32'); // Dark green
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 628);

        // Brand name
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Roboto, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.configService.get('BRAND_NAME', 'Teddy & Friends'), 600, 100);

        // Voucher title
        ctx.font = '32px Roboto, Arial, sans-serif';
        ctx.fillText(t('voucher.title', lang), 600, 180);

        // Client code
        ctx.font = 'bold 28px Roboto, Arial, sans-serif';
        ctx.fillText(clientCode, 600, 250);

        // QR Code placeholder (would be generated with qrcode library)
        ctx.fillStyle = 'white';
        ctx.fillRect(500, 300, 200, 200);
        ctx.fillStyle = '#333';
        ctx.font = '16px Roboto, Arial, sans-serif';
        ctx.fillText('QR CODE', 600, 410);

        // Voucher code
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Roboto, Arial, sans-serif';
        ctx.fillText(code, 600, 350);

        // Valid until
        ctx.font = '20px Roboto, Arial, sans-serif';
        ctx.fillText(t('voucher.validUntil', lang, { date: validUntil.toLocaleDateString() }), 600, 550);

        // Save image
        const filename = `voucher-${voucherId}-${Date.now()}.png`;
        const filepath = join(this.storagePath, 'storage', 'vouchers', filename);

        await mkdir(dirname(filepath), { recursive: true });
        await writeFile(filepath, canvas.toBuffer('image/png'));

        this.logger.log(`Voucher saved: ${filepath}`);
        return `/storage/vouchers/${filename}`;
    }

    private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}
