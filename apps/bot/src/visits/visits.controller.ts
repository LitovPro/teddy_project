import { Controller, Get, Post, Body, Param, Query, Logger } from '@nestjs/common';
import { VisitsService } from './visits.service';

@Controller('visits')
export class VisitsController {
    private readonly logger = new Logger(VisitsController.name);

    constructor(private readonly visitsService: VisitsService) { }

    @Post('code/generate')
    async generateVisitCode(@Body() body: { familyId: string }) {
        try {
            const code = await this.visitsService.generateVisitCode(body.familyId);
            return { success: true, code };
        } catch (error) {
            this.logger.error(`Failed to generate visit code: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { success: false, error: 'Failed to generate visit code' };
        }
    }

    @Post('code/validate')
    async validateVisitCode(@Body() body: { code: string; staffId?: string }) {
        try {
            const result = await this.visitsService.validateVisitCode(body.code, body.staffId);
            return result;
        } catch (error) {
            this.logger.error(`Failed to validate visit code: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { success: false, error: 'Failed to validate visit code' };
        }
    }

    @Post('qr/validate')
    async validateFamilyQR(@Body() body: { qrData: string; staffId?: string }) {
        try {
            const result = await this.visitsService.validateFamilyQR(body.qrData, body.staffId);
            return result;
        } catch (error) {
            this.logger.error(`Failed to validate family QR: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { success: false, error: 'Failed to validate family QR' };
        }
    }

    @Post('manual')
    async recordManualVisit(@Body() body: { familyId: string; staffId: string }) {
        try {
            const result = await this.visitsService.recordManualVisit(body.familyId, body.staffId);
            return result;
        } catch (error) {
            this.logger.error(`Failed to record manual visit: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { success: false, error: 'Failed to record manual visit' };
        }
    }

    @Get('family/:familyId')
    async getFamilyVisits(
        @Param('familyId') familyId: string,
        @Query('limit') limit?: string,
    ) {
        try {
            const limitNum = limit ? parseInt(limit, 10) : 10;
            const visits = await this.visitsService.getFamilyVisits(familyId, limitNum);
            return { success: true, visits };
        } catch (error) {
            this.logger.error(`Failed to get family visits: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { success: false, error: 'Failed to get family visits' };
        }
    }

    @Get('stats')
    async getVisitStats(
        @Query('dateFrom') dateFrom?: string,
        @Query('dateTo') dateTo?: string,
    ) {
        try {
            const fromDate = dateFrom ? new Date(dateFrom) : undefined;
            const toDate = dateTo ? new Date(dateTo) : undefined;

            const stats = await this.visitsService.getVisitStats(fromDate, toDate);
            return { success: true, stats };
        } catch (error) {
            this.logger.error(`Failed to get visit stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { success: false, error: 'Failed to get visit stats' };
        }
    }

    @Post('cleanup')
    async cleanupExpiredCodes() {
        try {
            await this.visitsService.cleanupExpiredCodes();
            return { success: true, message: 'Expired codes cleaned up' };
        } catch (error) {
            this.logger.error(`Failed to cleanup expired codes: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { success: false, error: 'Failed to cleanup expired codes' };
        }
    }
}
