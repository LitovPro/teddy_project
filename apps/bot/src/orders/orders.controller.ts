/**
 * NOTE: Payment/Orders functionality is currently disabled but kept for future use
 * 
 * This controller handles order-related API endpoints.
 * It is currently disabled because payment functionality is not needed in the bot.
 * 
 * DO NOT DELETE - This controller may be needed in the future for online payment integration.
 */
import { Controller, Get, Post, Body, Param, Query, Logger } from '@nestjs/common';
import { OrdersService, CreateOrderDto } from './orders.service';

@Controller('orders')
export class OrdersController {
    private readonly logger = new Logger(OrdersController.name);

    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    async createOrder(@Body() dto: CreateOrderDto) {
        try {
            const order = await this.ordersService.createOrder(dto);
            return { success: true, order };
        } catch (error) {
            this.logger.error(`Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { success: false, error: 'Failed to create order' };
        }
    }

    @Post(':orderId/payment-link')
    async generatePaymentLink(@Param('orderId') orderId: string) {
        try {
            const paymentLink = await this.ordersService.generatePaymentLink(orderId);
            return { success: true, paymentLink };
        } catch (error) {
            this.logger.error(`Failed to generate payment link: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { success: false, error: 'Failed to generate payment link' };
        }
    }

    @Post(':orderId/confirm-payment')
    async confirmPayment(
        @Param('orderId') orderId: string,
        @Body() body: { paymentId: string }
    ) {
        try {
            await this.ordersService.confirmPayment(orderId, body.paymentId);
            return { success: true, message: 'Payment confirmed' };
        } catch (error) {
            this.logger.error(`Failed to confirm payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { success: false, error: 'Failed to confirm payment' };
        }
    }

    @Get('family/:familyId')
    async getFamilyOrders(
        @Param('familyId') familyId: string,
        @Query('limit') limit?: string,
    ) {
        try {
            const limitNum = limit ? parseInt(limit, 10) : 10;
            const orders = await this.ordersService.getFamilyOrders(familyId, limitNum);
            return { success: true, orders };
        } catch (error) {
            this.logger.error(`Failed to get family orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { success: false, error: 'Failed to get family orders' };
        }
    }

    @Get('stats')
    async getOrderStats(
        @Query('dateFrom') dateFrom?: string,
        @Query('dateTo') dateTo?: string,
    ) {
        try {
            const fromDate = dateFrom ? new Date(dateFrom) : undefined;
            const toDate = dateTo ? new Date(dateTo) : undefined;

            const stats = await this.ordersService.getOrderStats(fromDate, toDate);
            return { success: true, stats };
        } catch (error) {
            this.logger.error(`Failed to get order stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { success: false, error: 'Failed to get order stats' };
        }
    }

    @Post(':orderId/cancel')
    async cancelOrder(@Param('orderId') orderId: string) {
        try {
            await this.ordersService.cancelOrder(orderId);
            return { success: true, message: 'Order cancelled' };
        } catch (error) {
            this.logger.error(`Failed to cancel order: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { success: false, error: 'Failed to cancel order' };
        }
    }
}
