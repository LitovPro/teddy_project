import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { VisitCodesService } from './visit-codes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { IssueCodeDtoType, ConfirmVisitDtoType } from '@teddy/shared';
import { handleError, handleSuccess } from '../common/utils';

@Controller('visits')
export class VisitCodesController {
  constructor(private visitCodesService: VisitCodesService) {}

  @Post('issue-code')
  @UseGuards(JwtAuthGuard)
  async issueCode(@Body() dto: IssueCodeDtoType) {
    try {
      const result = await this.visitCodesService.issueCode(dto);
      return handleSuccess(result);
    } catch (error) {
      return handleError(error);
    }
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  async confirmVisit(@Body() dto: ConfirmVisitDtoType) {
    try {
      const result = await this.visitCodesService.confirmCode(dto);
      return handleSuccess(result);
    } catch (error) {
      return handleError(error);
    }
  }

  @Get('codes/:familyId')
  @UseGuards(JwtAuthGuard)
  async getActiveCodes(@Param('familyId') familyId: string) {
    try {
      const codes = await this.visitCodesService.getActiveCodes(familyId);
      return handleSuccess(codes);
    } catch (error) {
      return handleError(error);
    }
  }

  @Get('codes/stats')
  @UseGuards(JwtAuthGuard)
  async getCodesStats() {
    try {
      const stats = await this.visitCodesService.getCodesStats();
      return handleSuccess(stats);
    } catch (error) {
      return handleError(error);
    }
  }
}
