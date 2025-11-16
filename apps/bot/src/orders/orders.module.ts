/**
 * NOTE: Payment/Orders functionality is currently disabled but kept for future use
 * 
 * This module handles online orders and payment processing (MBWay, PayPal).
 * It is currently disabled because payment functionality is not needed in the bot.
 * 
 * DO NOT DELETE - This module may be needed in the future for online payment integration.
 * 
 * To re-enable:
 * 1. Uncomment OrdersModule import in app.module.ts
 * 2. Uncomment OrdersModule import in waba.module.ts
 * 3. Uncomment OrdersService import and injection in waba.controller.ts
 * 4. Uncomment 'order' command handler in waba.controller.ts
 * 5. Uncomment sendOrderMessage method in waba.controller.ts
 */
import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PaymentWebhookController } from './payment-webhook.controller';
import { MbwayService } from './mbway.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TwilioModule } from '../twilio/twilio.module';
import { I18nModule } from '../i18n/i18n.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [PrismaModule, TwilioModule, I18nModule, ConfigModule],
    providers: [OrdersService, MbwayService],
    controllers: [OrdersController, PaymentWebhookController],
    exports: [OrdersService, MbwayService],
})
export class OrdersModule { }
