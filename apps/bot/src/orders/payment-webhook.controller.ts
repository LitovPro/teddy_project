/**
 * NOTE: Payment/Orders functionality is currently disabled but kept for future use
 * 
 * This controller handles payment webhooks from payment providers (MBWay, PayPal, etc.).
 * It is currently disabled because payment functionality is not needed in the bot.
 * 
 * DO NOT DELETE - This controller may be needed in the future for online payment integration.
 */
import { Controller, Post, Body, Headers, Logger } from '@nestjs/common';
import { MbwayService } from './mbway.service';
import { OrdersService } from './orders.service';

@Controller('webhooks/payments')
export class PaymentWebhookController {
    private readonly logger = new Logger(PaymentWebhookController.name);

    constructor(
        private readonly mbwayService: MbwayService,
        private readonly ordersService: OrdersService,
    ) { }

    @Post('mbway')
    async handleMbwayWebhook(
        @Body() webhookData: any,
        @Headers('x-mbway-signature') signature?: string,
    ) {
        try {
            this.logger.log(`Received MBWay webhook: ${JSON.stringify(webhookData)}`);

            // В реальной реализации здесь была бы проверка подписи
            // if (!this.verifyMbwaySignature(webhookData, signature)) {
            //   throw new Error('Invalid signature');
            // }

            // Обрабатываем webhook
            const result = await this.mbwayService.processPaymentWebhook(webhookData);

            if (result.success && result.orderId && result.paymentId) {
                // Подтверждаем оплату заказа
                await this.ordersService.confirmPayment(result.orderId, result.paymentId);

                this.logger.log(`Payment confirmed for order ${result.orderId}`);
            }

            return { success: true, message: 'Webhook processed' };
        } catch (error) {
            this.logger.error(`Failed to process MBWay webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { success: false, error: 'Failed to process webhook' };
        }
    }

    @Post('test-payment')
    async testPayment(@Body() body: { orderId: string; paymentId: string }) {
        try {
            this.logger.log(`Testing payment confirmation for order ${body.orderId}`);

            // Тестовый webhook для подтверждения платежа
            await this.ordersService.confirmPayment(body.orderId, body.paymentId);

            return { success: true, message: 'Test payment confirmed' };
        } catch (error) {
            this.logger.error(`Failed to process test payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { success: false, error: 'Failed to process test payment' };
        }
    }
}
