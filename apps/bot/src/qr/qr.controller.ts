import { Controller, Get, Param, Query, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { QrService } from './qr.service';

@Controller('qr')
export class QrController {
    private readonly logger = new Logger(QrController.name);

    constructor(private readonly qrService: QrService) { }

    @Get('entry')
    async getEntryQR(@Res() res: Response) {
        try {
            const qrCodeDataURL = await this.qrService.generateEntryQR();

            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'public, max-age=3600');

            // Конвертируем data URL в buffer
            const base64Data = qrCodeDataURL.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');

            res.send(buffer);
        } catch (error) {
            this.logger.error(`Failed to generate entry QR: ${error instanceof Error ? error.message : 'Unknown error'}`);
            res.status(500).json({ error: 'Failed to generate QR code' });
        }
    }

    @Get('family/:familyId')
    async getFamilyQR(
        @Param('familyId') familyId: string,
        @Query('clientCode') clientCode: string,
        @Res() res: Response,
    ) {
        try {
            if (!clientCode) {
                res.status(400).json({ error: 'Client code is required' });
                return;
            }

            const qrCodeDataURL = await this.qrService.generateFamilyQR(familyId, clientCode);

            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'public, max-age=3600');

            const base64Data = qrCodeDataURL.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');

            res.send(buffer);
        } catch (error) {
            this.logger.error(`Failed to generate family QR: ${error instanceof Error ? error.message : 'Unknown error'}`);
            res.status(500).json({ error: 'Failed to generate family QR code' });
        }
    }

    @Get('voucher/:voucherId')
    async getVoucherQR(
        @Param('voucherId') voucherId: string,
        @Query('voucherCode') voucherCode: string,
        @Res() res: Response,
    ) {
        try {
            if (!voucherCode) {
                res.status(400).json({ error: 'Voucher code is required' });
                return;
            }

            const qrCodeDataURL = await this.qrService.generateVoucherQR(voucherId, voucherCode);

            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'public, max-age=3600');

            const base64Data = qrCodeDataURL.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');

            res.send(buffer);
        } catch (error) {
            this.logger.error(`Failed to generate voucher QR: ${error instanceof Error ? error.message : 'Unknown error'}`);
            res.status(500).json({ error: 'Failed to generate voucher QR code' });
        }
    }
}
