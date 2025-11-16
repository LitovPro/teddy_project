import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { BroadcastsService } from './broadcasts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BroadcastDtoType } from '@teddy/shared';
import { handleError, handleSuccess } from '../common/utils';

@Controller('broadcasts')
@UseGuards(JwtAuthGuard)
export class BroadcastsController {
    constructor(private broadcastsService: BroadcastsService) { }

    @Post()
    async sendBroadcast(@Body() dto: BroadcastDtoType) {
        try {
            const result = await this.broadcastsService.sendBroadcast(dto);
            return handleSuccess(result);
        } catch (error) {
            return handleError(error);
        }
    }

    @Get()
    async getBroadcasts() {
        try {
            const broadcasts = await this.broadcastsService.getBroadcasts();
            return handleSuccess(broadcasts);
        } catch (error) {
            return handleError(error);
        }
    }
}
