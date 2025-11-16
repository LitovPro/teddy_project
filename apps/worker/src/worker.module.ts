import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ImageRenderProcessor } from './processors/image-render.processor';
import { NotificationProcessor } from './processors/notification.processor';

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
  ],
  providers: [ImageRenderProcessor, NotificationProcessor],
})
export class WorkerModule {}
