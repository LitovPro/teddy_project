import { Controller, Get, Param, Query, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ImagesService } from './images.service';

@Controller('images')
export class ImagesController {
  private readonly logger = new Logger(ImagesController.name);

  constructor(private readonly imagesService: ImagesService) { }

  @Get('loyalty-card/:familyId')
  async getLoyaltyCard(
    @Param('familyId') familyId: string,
    @Query('lang') language: 'EN' | 'PT' = 'EN',
    @Res() res: Response,
  ) {
    try {
      const imageBase64 = await this.imagesService.generateLoyaltyCard(familyId, language);

      // Set headers for image response
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

      // Convert base64 to buffer and send
      const buffer = Buffer.from(imageBase64.split(',')[1], 'base64');
      res.send(buffer);
    } catch (error) {
      this.logger.error(`Failed to generate loyalty card: ${error instanceof Error ? error.message : 'Unknown error'}`);
      res.status(404).json({ error: 'Loyalty card not found' });
    }
  }

  @Get('voucher/:voucherId')
  async getVoucher(
    @Param('voucherId') voucherId: string,
    @Query('lang') language: 'EN' | 'PT' = 'EN',
    @Res() res: Response,
  ) {
    try {
      const imageBase64 = await this.imagesService.generateVoucher(voucherId, language);

      // Set headers for image response
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

      // Convert base64 to buffer and send
      const buffer = Buffer.from(imageBase64.split(',')[1], 'base64');
      res.send(buffer);
    } catch (error) {
      this.logger.error(`Failed to generate voucher: ${error instanceof Error ? error.message : 'Unknown error'}`);
      res.status(404).json({ error: 'Voucher not found' });
    }
  }
}
