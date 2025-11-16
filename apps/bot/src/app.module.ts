import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { BullModule } from '@nestjs/bullmq';
import { join } from 'path';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FamiliesModule } from './families/families.module';
import { MenuModule } from './menu/menu.module';
import { WabaModule } from './waba/waba.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { VouchersModule } from './vouchers/vouchers.module';
import { ImagesModule } from './images/images.module';
import { BroadcastsModule } from './broadcasts/broadcasts.module';
import { TwilioModule } from './twilio/twilio.module';
import { QrModule } from './qr/qr.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { VisitsModule } from './visits/visits.module';
import { I18nModule } from './i18n/i18n.module';
// NOTE: Payment/Orders functionality is currently disabled but kept for future use
// DO NOT DELETE - This module may be needed in the future for online payment integration
// import { OrdersModule } from './orders/orders.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { EventsModule } from './events/events.module';
import { GdprModule } from './gdpr/gdpr.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    BullModule.registerQueue(
      { name: 'image-render' },
      { name: 'notifications' },
    ),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'storage'),
      serveRoot: '/storage',
    }),
    PrismaModule,
    AuthModule,
    FamiliesModule,
    MenuModule,
    WabaModule,
    LoyaltyModule,
    VouchersModule,
    ImagesModule,
    BroadcastsModule,
    TwilioModule,
    QrModule,
    OnboardingModule,
    VisitsModule,
    I18nModule,
    // NOTE: OrdersModule disabled - payment functionality not needed currently
    // DO NOT DELETE - May be needed in the future for online payment integration
    // OrdersModule,
    SubscriptionsModule,
    EventsModule,
    GdprModule,
  ],
  controllers: [HealthController],
})
export class AppModule { }
