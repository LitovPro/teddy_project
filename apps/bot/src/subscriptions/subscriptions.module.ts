import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TwilioModule } from '../twilio/twilio.module';
import { I18nModule } from '../i18n/i18n.module';

@Module({
    imports: [PrismaModule, TwilioModule, I18nModule],
    controllers: [SubscriptionsController],
    providers: [SubscriptionsService],
    exports: [SubscriptionsService],
})
export class SubscriptionsModule { }
