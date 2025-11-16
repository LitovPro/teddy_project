import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject } from 'class-validator';
import { TwilioService } from './twilio.service';

export class SendMessageDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    to: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    body: string;
}

export class SendTemplateDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    to: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    contentSid: string;

    @ApiProperty()
    @IsObject()
    contentVariables: Record<string, string>;
}

export class SendAppointmentDto {
    to: string;
    date: string;
    time: string;
}

@ApiTags('Twilio WhatsApp')
@Controller('twilio')
export class TwilioController {
    private readonly logger = new Logger(TwilioController.name);

    constructor(private readonly twilioService: TwilioService) { }

    @Post('send-text')
    @ApiOperation({ summary: 'Send a simple text message' })
    @ApiResponse({ status: 200, description: 'Message sent successfully' })
    async sendTextMessage(@Body() dto: SendMessageDto) {
        try {
            const messageSid = await this.twilioService.sendTextMessage(dto.to, dto.body);
            return {
                success: true,
                messageSid,
                message: 'Text message sent successfully',
            };
        } catch (error) {
            this.logger.error(`Failed to send text message: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    @Post('send-template')
    @ApiOperation({ summary: 'Send a template message' })
    @ApiResponse({ status: 200, description: 'Template message sent successfully' })
    async sendTemplateMessage(@Body() dto: SendTemplateDto) {
        try {
            const messageSid = await this.twilioService.sendTemplateMessage(
                dto.to,
                dto.contentSid,
                dto.contentVariables
            );
            return {
                success: true,
                messageSid,
                message: 'Template message sent successfully',
            };
        } catch (error) {
            this.logger.error(`Failed to send template message: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    @Post('send-appointment')
    @ApiOperation({ summary: 'Send appointment reminder' })
    @ApiResponse({ status: 200, description: 'Appointment reminder sent successfully' })
    async sendAppointmentReminder(@Body() dto: SendAppointmentDto) {
        try {
            const messageSid = await this.twilioService.sendAppointmentReminder(
                dto.to,
                dto.date,
                dto.time
            );
            return {
                success: true,
                messageSid,
                message: 'Appointment reminder sent successfully',
            };
        } catch (error) {
            this.logger.error(`Failed to send appointment reminder: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    @Post('send-loyalty-progress')
    @ApiOperation({ summary: 'Send loyalty progress update' })
    @ApiResponse({ status: 200, description: 'Loyalty progress sent successfully' })
    async sendLoyaltyProgress(
        @Body() dto: { to: string; current: number; target: number; language?: 'EN' | 'PT' }
    ) {
        try {
            const messageSid = await this.twilioService.sendLoyaltyProgress(
                dto.to,
                dto.current,
                dto.target,
                dto.language || 'EN'
            );
            return {
                success: true,
                messageSid,
                message: 'Loyalty progress sent successfully',
            };
        } catch (error) {
            this.logger.error(`Failed to send loyalty progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    @Post('send-voucher-notification')
    @ApiOperation({ summary: 'Send voucher notification' })
    @ApiResponse({ status: 200, description: 'Voucher notification sent successfully' })
    async sendVoucherNotification(
        @Body() dto: { to: string; voucherCode: string; language?: 'EN' | 'PT' }
    ) {
        try {
            const messageSid = await this.twilioService.sendVoucherNotification(
                dto.to,
                dto.voucherCode,
                dto.language || 'EN'
            );
            return {
                success: true,
                messageSid,
                message: 'Voucher notification sent successfully',
            };
        } catch (error) {
            this.logger.error(`Failed to send voucher notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    @Post('send-welcome')
    @ApiOperation({ summary: 'Send welcome message' })
    @ApiResponse({ status: 200, description: 'Welcome message sent successfully' })
    async sendWelcomeMessage(
        @Body() dto: { to: string; clientCode: string; language?: 'EN' | 'PT' }
    ) {
        try {
            const messageSid = await this.twilioService.sendWelcomeMessage(
                dto.to,
                dto.clientCode,
                dto.language || 'EN'
            );
            return {
                success: true,
                messageSid,
                message: 'Welcome message sent successfully',
            };
        } catch (error) {
            this.logger.error(`Failed to send welcome message: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}
