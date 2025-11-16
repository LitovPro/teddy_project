import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueService } from './queue.service';
import { ImageQueueProcessor } from './processors/image-queue.processor';
import { NotificationQueueProcessor } from './processors/notification-queue.processor';

@Module({
    imports: [
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
    ],
    providers: [QueueService, ImageQueueProcessor, NotificationQueueProcessor],
    exports: [QueueService],
})
export class QueueModule { }
