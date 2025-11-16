import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('subscriptions')
@Controller('api/subscriptions')
export class SubscriptionsController {
    constructor(private readonly subscriptionsService: SubscriptionsService) { }

    @Post('subscribe')
    @ApiOperation({ summary: 'Subscribe family to notifications' })
    @ApiResponse({ status: 201, description: 'Successfully subscribed' })
    async subscribe(
        @Body() dto: { familyId: string; type: 'events' | 'promotions' | 'news' }
    ) {
        try {
            const result = await this.subscriptionsService.subscribeFamily(dto.familyId, dto.type);
            return { success: true, data: result };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    @Post('unsubscribe')
    @ApiOperation({ summary: 'Unsubscribe family from notifications' })
    @ApiResponse({ status: 200, description: 'Successfully unsubscribed' })
    async unsubscribe(
        @Body() dto: { familyId: string; type: 'events' | 'promotions' | 'news' }
    ) {
        try {
            const result = await this.subscriptionsService.unsubscribeFamily(dto.familyId, dto.type);
            return { success: true, data: result };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    @Get('family/:familyId')
    @ApiOperation({ summary: 'Get family subscriptions' })
    @ApiResponse({ status: 200, description: 'Family subscriptions retrieved' })
    async getFamilySubscriptions(@Param('familyId') familyId: string) {
        try {
            const subscriptions = await this.subscriptionsService.getFamilySubscriptions(familyId);
            return { success: true, data: subscriptions };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    @Get('subscribers')
    @ApiOperation({ summary: 'Get subscribers by type' })
    @ApiResponse({ status: 200, description: 'Subscribers retrieved' })
    async getSubscribers(@Query('type') type: 'events' | 'promotions' | 'news') {
        try {
            const subscribers = await this.subscriptionsService.getSubscribers(type);
            return { success: true, data: subscribers };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get subscription statistics' })
    @ApiResponse({ status: 200, description: 'Subscription statistics retrieved' })
    async getStats() {
        try {
            const stats = await this.subscriptionsService.getSubscriptionStats();
            return { success: true, data: stats };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
