/**
 * NOTE: Payment/Orders functionality is currently disabled but kept for future use
 * 
 * This service handles order creation, payment processing, and order management.
 * It is currently disabled because payment functionality is not needed in the bot.
 * 
 * DO NOT DELETE - This service may be needed in the future for online payment integration.
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TwilioService } from '../twilio/twilio.service';
import { I18nService } from '../i18n/i18n.service';
import { MbwayService } from './mbway.service';

export interface OrderItem {
    menuItemId: string;
    quantity: number;
    price: number;
}

export interface CreateOrderDto {
    familyId: string;
    items: OrderItem[];
}

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly twilioService: TwilioService,
        private readonly i18nService: I18nService,
        private readonly mbwayService: MbwayService,
    ) { }

    /**
     * Создает новый заказ
     */
    async createOrder(dto: CreateOrderDto): Promise<any> {
        try {
            // Получаем информацию о семье
            const family = await this.prisma.family.findUnique({
                where: { id: String(dto.familyId) }
            });

            if (!family) {
                throw new Error('Family not found');
            }

            // Вычисляем общую сумму
            const totalAmount = dto.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            // Создаем заказ
            const order = await this.prisma.order.create({
                data: {
                    familyId: String(dto.familyId),
                    items: dto.items as any,
                    totalAmount: totalAmount,
                    status: 'PENDING',
                }
            });

            // Создаем записи OrderItem
            for (const item of dto.items) {
                await this.prisma.orderItem.create({
                    data: {
                        orderId: order.id,
                        menuItemId: item.menuItemId,
                        quantity: item.quantity,
                        price: item.price,
                    }
                });
            }

            this.logger.log(`Order ${order.id} created for family ${family.clientCode}, total: €${totalAmount}`);

            return order;
        } catch (error) {
            this.logger.error(`Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    /**
     * Генерирует платежную ссылку MBWay
     */
    async generatePaymentLink(orderId: string): Promise<string> {
        try {
            const order = await this.prisma.order.findUnique({
                where: { id: orderId },
                include: { family: true }
            });

            if (!order) {
                throw new Error('Order not found');
            }

            if (order.status !== 'PENDING') {
                throw new Error('Order is not pending');
            }

            // Генерируем платежную ссылку MBWay
            const paymentLink = await this.mbwayService.createPaymentLink(
                Number(order.totalAmount),
                `Teddy & Friends - Order ${order.id}`,
                order.family.phone
            );

            // Обновляем заказ с платежной ссылкой
            await this.prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentLink: paymentLink,
                    paymentMethod: 'mbway',
                }
            });

            this.logger.log(`Payment link generated for order ${orderId}`);

            return paymentLink;
        } catch (error) {
            this.logger.error(`Failed to generate payment link: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    /**
     * Подтверждает оплату заказа
     */
    async confirmPayment(orderId: string, paymentId: string): Promise<void> {
        try {
            const order = await this.prisma.order.findUnique({
                where: { id: orderId }
            });

            if (!order) {
                throw new Error('Order not found');
            }

            // Обновляем статус заказа
            await this.prisma.order.update({
                where: { id: orderId },
                data: {
                    status: 'PAID',
                    paymentId: paymentId,
                    paidAt: new Date(),
                }
            });

            // Отправляем подтверждение клиенту
            await this.sendOrderConfirmation(orderId);

            this.logger.log(`Payment confirmed for order ${orderId}`);
        } catch (error) {
            this.logger.error(`Failed to confirm payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    /**
     * Отправляет подтверждение заказа клиенту
     */
    private async sendOrderConfirmation(orderId: string): Promise<void> {
        try {
            const order = await this.prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    family: true,
                    orderItems: {
                        include: {
                            menuItem: true
                        }
                    }
                }
            });

            if (!order) {
                this.logger.error(`Order not found: ${orderId}`);
                return;
            }

            const language = order.family.preferredLanguage as 'EN' | 'PT';

            let message: string;

            if (language === 'EN') {
                message = `✅ *Order Confirmed!*\n\nOrder #${order.id}\nTotal: €${order.totalAmount}\n\nYour order is being prepared and will be ready soon!\n\nThank you for choosing Teddy & Friends! 🐻`;
            } else {
                message = `✅ *Pedido Confirmado!*\n\nPedido #${order.id}\nTotal: €${order.totalAmount}\n\nO seu pedido está a ser preparado e estará pronto em breve!\n\nObrigado por escolher o Teddy & Friends! 🐻`;
            }

            await this.twilioService.sendTextMessage(order.family.phone, message);

        } catch (error) {
            this.logger.error(`Failed to send order confirmation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Получает историю заказов семьи
     */
    async getFamilyOrders(familyId: string, limit: number = 10): Promise<any[]> {
        try {
            const orders = await this.prisma.order.findMany({
                where: { familyId: familyId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                include: {
                    orderItems: {
                        include: {
                            menuItem: true
                        }
                    }
                }
            });

            return orders;
        } catch (error) {
            this.logger.error(`Failed to get family orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return [];
        }
    }

    /**
     * Получает статистику заказов
     */
    async getOrderStats(dateFrom?: Date, dateTo?: Date): Promise<any> {
        try {
            const whereClause: any = {};

            if (dateFrom || dateTo) {
                whereClause.createdAt = {};
                if (dateFrom) whereClause.createdAt.gte = dateFrom;
                if (dateTo) whereClause.createdAt.lte = dateTo;
            }

            const totalOrders = await this.prisma.order.count({
                where: whereClause
            });

            const ordersByStatus = await this.prisma.order.groupBy({
                by: ['status'],
                where: whereClause,
                _count: { status: true }
            });

            const totalRevenue = await this.prisma.order.aggregate({
                where: {
                    ...whereClause,
                    status: 'PAID'
                },
                _sum: {
                    totalAmount: true
                }
            });

            return {
                totalOrders,
                ordersByStatus,
                totalRevenue: totalRevenue._sum.totalAmount || 0
            };
        } catch (error) {
            this.logger.error(`Failed to get order stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { totalOrders: 0, ordersByStatus: [], totalRevenue: 0 };
        }
    }

    /**
     * Отменяет заказ
     */
    async cancelOrder(orderId: string): Promise<void> {
        try {
            const order = await this.prisma.order.findUnique({
                where: { id: orderId }
            });

            if (!order) {
                throw new Error('Order not found');
            }

            if (order.status !== 'PENDING') {
                throw new Error('Order cannot be cancelled');
            }

            await this.prisma.order.update({
                where: { id: orderId },
                data: {
                    status: 'CANCELLED'
                }
            });

            this.logger.log(`Order ${orderId} cancelled`);
        } catch (error) {
            this.logger.error(`Failed to cancel order: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
}
