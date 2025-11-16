import { Module } from '@nestjs/common';
import { BroadcastsController } from './broadcasts.controller';
import { BroadcastsService } from './broadcasts.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TwilioModule } from '../twilio/twilio.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { I18nModule } from '../i18n/i18n.module';

@Module({
    imports: [
        PrismaModule,
        TwilioModule,
        SubscriptionsModule,
        I18nModule
    ],
    controllers: [BroadcastsController],
    providers: [BroadcastsService],
    exports: [BroadcastsService],
})
export class BroadcastsModule { }
