import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';

@Controller('loyalty')
export class LoyaltyController {
  private readonly logger = new Logger(LoyaltyController.name);

  constructor(private readonly loyaltyService: LoyaltyService) { }

  @Post('update')
  async updateLoyaltyCounter(@Body() body: { familyId: string }) {
    try {
      await this.loyaltyService.updateLoyaltyCounter(body.familyId);
      return { success: true, message: 'Loyalty counter updated' };
    } catch (error) {
      this.logger.error(`Failed to update loyalty counter: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, error: 'Failed to update loyalty counter' };
    }
  }

  @Post('voucher/generate')
  async generateVoucher(@Body() body: { familyId: string }) {
    try {
      await this.loyaltyService.generateVoucher(body.familyId);
      return { success: true, message: 'Voucher generated' };
    } catch (error) {
      this.logger.error(`Failed to generate voucher: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, error: 'Failed to generate voucher' };
    }
  }

  @Post('voucher/redeem')
  async redeemVoucher(@Body() body: { voucherCode: string; staffId: string }) {
    try {
      const result = await this.loyaltyService.redeemVoucher(body.voucherCode, body.staffId);
      return result;
    } catch (error) {
      this.logger.error(`Failed to redeem voucher: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, error: 'Failed to redeem voucher' };
    }
  }

  @Get('status/:familyId')
  async getLoyaltyStatus(@Param('familyId') familyId: string) {
    try {
      const status = await this.loyaltyService.getLoyaltyStatus(familyId);
      return { success: true, status };
    } catch (error) {
      this.logger.error(`Failed to get loyalty status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, error: 'Failed to get loyalty status' };
    }
  }

  @Post('card/send')
  async sendLoyaltyCard(@Body() body: { familyId: string }) {
    try {
      await this.loyaltyService.sendLoyaltyCard(body.familyId);
      return { success: true, message: 'Loyalty card sent' };
    } catch (error) {
      this.logger.error(`Failed to send loyalty card: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, error: 'Failed to send loyalty card' };
    }
  }

  @Get('stats')
  async getLoyaltyStats() {
    try {
      const stats = await this.loyaltyService.getLoyaltyStats();
      return { success: true, stats };
    } catch (error) {
      this.logger.error(`Failed to get loyalty stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, error: 'Failed to get loyalty stats' };
    }
  }
}