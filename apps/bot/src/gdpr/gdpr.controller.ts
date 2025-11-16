import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConsentService } from './consent.service';
import { DataDeletionService } from './data-deletion.service';

@ApiTags('gdpr')
@Controller('api/gdpr')
export class GdprController {
    constructor(
        private readonly consentService: ConsentService,
        private readonly dataDeletionService: DataDeletionService,
    ) { }

    @Post('consent')
    @ApiOperation({ summary: 'Update family consent' })
    @ApiResponse({ status: 200, description: 'Consent updated successfully' })
    async updateConsent(@Body() dto: {
        familyId: string;
        marketing?: boolean;
        gdpr?: boolean;
        dataProcessing?: boolean;
        analytics?: boolean;
    }) {
        try {
            const consent = await this.consentService.updateConsent(dto.familyId, dto);
            return { success: true, data: consent };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    @Get('consent/:familyId')
    @ApiOperation({ summary: 'Get family consent' })
    @ApiResponse({ status: 200, description: 'Consent retrieved successfully' })
    async getFamilyConsent(@Param('familyId') familyId: string) {
        try {
            const consent = await this.consentService.getFamilyConsent(familyId);
            return { success: true, data: consent };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    @Post('consent/:familyId/request')
    @ApiOperation({ summary: 'Request consent from family' })
    @ApiResponse({ status: 200, description: 'Consent request sent successfully' })
    async requestConsent(@Param('familyId') familyId: string) {
        try {
            await this.consentService.requestConsent(familyId);
            return { success: true, message: 'Consent request sent' };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    @Get('consent/stats/overview')
    @ApiOperation({ summary: 'Get consent statistics' })
    @ApiResponse({ status: 200, description: 'Consent statistics retrieved' })
    async getConsentStats() {
        try {
            const stats = await this.consentService.getConsentStats();
            return { success: true, data: stats };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    @Post('data-deletion/request')
    @ApiOperation({ summary: 'Request data deletion' })
    @ApiResponse({ status: 201, description: 'Data deletion request created' })
    async requestDataDeletion(@Body() dto: {
        familyId: string;
        reason?: string;
    }) {
        try {
            const request = await this.dataDeletionService.requestDataDeletion(dto.familyId, dto.reason);
            return { success: true, data: request };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    @Post('data-deletion/:familyId/execute')
    @ApiOperation({ summary: 'Execute data deletion' })
    @ApiResponse({ status: 200, description: 'Data deletion executed successfully' })
    async executeDataDeletion(
        @Param('familyId') familyId: string,
        @Body() body: { staffId: string }
    ) {
        try {
            const result = await this.dataDeletionService.executeDataDeletion(familyId, body.staffId);
            return { success: true, data: result };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    @Post('data-export/:familyId')
    @ApiOperation({ summary: 'Export family data' })
    @ApiResponse({ status: 200, description: 'Data export completed' })
    async exportFamilyData(@Param('familyId') familyId: string) {
        try {
            const result = await this.dataDeletionService.exportFamilyData(familyId);
            return { success: true, data: result };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    @Get('data-deletion/requests')
    @ApiOperation({ summary: 'Get data deletion requests' })
    @ApiResponse({ status: 200, description: 'Deletion requests retrieved' })
    async getDeletionRequests() {
        try {
            const requests = await this.dataDeletionService.getDeletionRequests();
            return { success: true, data: requests };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    @Get('stats/overview')
    @ApiOperation({ summary: 'Get GDPR statistics' })
    @ApiResponse({ status: 200, description: 'GDPR statistics retrieved' })
    async getGdprStats() {
        try {
            const stats = await this.dataDeletionService.getGdprStats();
            return { success: true, data: stats };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
