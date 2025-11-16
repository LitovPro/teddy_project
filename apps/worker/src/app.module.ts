import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { ImageProcessorModule } from './image-processor/image-processor.module';
import { NotificationModule } from './notification/notification.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
        }),
        PrismaModule,
        QueueModule,
        ImageProcessorModule,
        NotificationModule,
    ],
})
export class AppModule { }
