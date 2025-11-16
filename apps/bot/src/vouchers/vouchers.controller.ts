import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RedeemVoucherDtoType } from '@teddy/shared';
import { handleError, handleSuccess } from '../common/utils';

@Controller('vouchers')
@UseGuards(JwtAuthGuard)
export class VouchersController {
  constructor(private vouchersService: VouchersService) { }

  @Post('redeem')
  async redeemVoucher(@Body() dto: RedeemVoucherDtoType) {
    try {
      const voucher = await this.vouchersService.redeemVoucher(dto.code, dto.staffId);
      return handleSuccess(voucher);
    } catch (error) {
      return handleError(error);
    }
  }

  @Get('family/:familyId')
  async getFamilyVouchers(@Param('familyId') familyId: string) {
    try {
      const vouchers = await this.vouchersService.getActiveVouchers(familyId);
      return handleSuccess(vouchers);
    } catch (error) {
      return handleError(error);
    }
  }

  @Get()
  async getAllVouchers() {
    try {
      const vouchers = await this.vouchersService.getAllVouchers();
      return handleSuccess(vouchers);
    } catch (error) {
      return handleError(error);
    }
  }

  @Get('stats')
  async getVoucherStats() {
    try {
      const stats = await this.vouchersService.getVoucherStats();
      return handleSuccess(stats);
    } catch (error) {
      return handleError(error);
    }
  }
}
