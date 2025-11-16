import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
    private readonly logger = new Logger(QueueService.name);

    constructor(
        @InjectQueue('image-render') private imageQueue: Queue,
        @InjectQueue('notifications') private notificationQueue: Queue,
    ) { }

    async addImageJob(type: 'loyalty-card' | 'voucher', data: any) {
        return this.imageQueue.add(type, data, {
            priority: type === 'voucher' ? 1 : 2, // Vouchers have higher priority
        });
    }

    async addNotificationJob(type: 'broadcast' | 'visit-confirmation' | 'voucher-issued', data: any) {
        return this.notificationQueue.add(type, data);
    }

    async getQueueStats() {
        const [imageStats, notificationStats] = await Promise.all([
            this.imageQueue.getJobCounts(),
            this.notificationQueue.getJobCounts(),
        ]);

        return {
            image: imageStats,
            notification: notificationStats,
        };
    }
}
