import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { BookingsService } from './bookings.service';
import { EventsController } from './events.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TwilioModule } from '../twilio/twilio.module';
import { I18nModule } from '../i18n/i18n.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
    imports: [PrismaModule, TwilioModule, I18nModule, SubscriptionsModule],
    controllers: [EventsController],
    providers: [EventsService, BookingsService],
    exports: [EventsService, BookingsService],
})
export class EventsModule { }
