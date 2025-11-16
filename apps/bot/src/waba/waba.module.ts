import { Module } from '@nestjs/common';
import { WabaService } from './waba.service';
import { WabaController } from './waba.controller';
import { ConversationService } from './conversation.service';
import { MessageProcessorService } from './message-processor.service';
import { UtilityMessagesService } from './utility-messages.service';
import { I18nService } from './i18n.service';
import { FamiliesModule } from '../families/families.module';
import { TwilioModule } from '../twilio/twilio.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { VisitsModule } from '../visits/visits.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { I18nModule } from '../i18n/i18n.module';
// NOTE: Payment/Orders functionality is currently disabled but kept for future use
// DO NOT DELETE - This module may be needed in the future for online payment integration
// import { OrdersModule } from '../orders/orders.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { EventsModule } from '../events/events.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    FamiliesModule,
    TwilioModule,
    OnboardingModule,
    VisitsModule,
    LoyaltyModule,
    I18nModule,
    // NOTE: OrdersModule disabled - payment functionality not needed currently
    // DO NOT DELETE - May be needed in the future for online payment integration
    // OrdersModule,
    SubscriptionsModule,
    EventsModule
  ],
  controllers: [WabaController],
  providers: [
    WabaService,
    ConversationService,
    MessageProcessorService,
    UtilityMessagesService,
    I18nService,
  ],
  exports: [WabaService, ConversationService, UtilityMessagesService],
})
export class WabaModule { }
