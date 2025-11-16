import { Module } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { VisitsController } from './visits.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TwilioModule } from '../twilio/twilio.module';
import { QrModule } from '../qr/qr.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';

@Module({
    imports: [PrismaModule, TwilioModule, QrModule, LoyaltyModule],
    providers: [VisitsService],
    controllers: [VisitsController],
    exports: [VisitsService],
})
export class VisitsModule { }
