import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
export class OnboardingController {
    private readonly logger = new Logger(OnboardingController.name);

    constructor(private readonly onboardingService: OnboardingService) { }

    @Post('start')
    async handleStart(@Body() body: { phoneNumber: string; waId: string }) {
        try {
            await this.onboardingService.handleStartMessage(body.phoneNumber, body.waId);
            return { success: true, message: 'Onboarding started' };
        } catch (error) {
            this.logger.error(`Failed to start onboarding: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { success: false, error: 'Failed to start onboarding' };
        }
    }

    @Post('language')
    async handleLanguageSelection(@Body() body: { phoneNumber: string; language: 'EN' | 'PT' }) {
        try {
            await this.onboardingService.handleLanguageSelection(body.phoneNumber, body.language);
            return { success: true, message: 'Language selected' };
        } catch (error) {
            this.logger.error(`Failed to handle language selection: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { success: false, error: 'Failed to select language' };
        }
    }

    @Post('complete')
    async completeOnboarding(@Body() body: { phoneNumber: string }) {
        try {
            await this.onboardingService.completeOnboarding(body.phoneNumber);
            return { success: true, message: 'Onboarding completed' };
        } catch (error) {
            this.logger.error(`Failed to complete onboarding: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { success: false, error: 'Failed to complete onboarding' };
        }
    }

    @Get('status/:phoneNumber')
    async getOnboardingStatus(@Param('phoneNumber') phoneNumber: string) {
        try {
            const status = await this.onboardingService.getOnboardingStatus(phoneNumber);
            return { success: true, status };
        } catch (error) {
            this.logger.error(`Failed to get onboarding status: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { success: false, error: 'Failed to get onboarding status' };
        }
    }

    @Get('family/:phoneNumber')
    async getFamilyInfo(@Param('phoneNumber') phoneNumber: string) {
        try {
            const familyInfo = await this.onboardingService.getFamilyInfo(phoneNumber);
            return { success: true, family: familyInfo };
        } catch (error) {
            this.logger.error(`Failed to get family info: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { success: false, error: 'Failed to get family info' };
        }
    }
}
