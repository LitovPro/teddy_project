import { Module } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TwilioModule } from '../twilio/twilio.module';
import { QrModule } from '../qr/qr.module';

@Module({
    imports: [PrismaModule, TwilioModule, QrModule],
    providers: [OnboardingService],
    controllers: [OnboardingController],
    exports: [OnboardingService],
})
export class OnboardingModule { }
