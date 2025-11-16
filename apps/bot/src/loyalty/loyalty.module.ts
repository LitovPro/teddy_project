import { Module } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TwilioModule } from '../twilio/twilio.module';
import { QrModule } from '../qr/qr.module';
import { ImagesModule } from '../images/images.module';

@Module({
  imports: [PrismaModule, TwilioModule, QrModule, ImagesModule],
  providers: [LoyaltyService],
  controllers: [LoyaltyController],
  exports: [LoyaltyService],
})
export class LoyaltyModule { }