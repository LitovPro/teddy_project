import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Worker');
  
  try {
    const app = await NestFactory.createApplicationContext(WorkerModule);
    
    logger.log('🚀 Worker started successfully');
    logger.log('📊 Processing queues: image-render, notifications');
    
    // Keep the worker running
    process.on('SIGINT', async () => {
      logger.log('�� Shutting down worker...');
      await app.close();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.log('🛑 Shutting down worker...');
      await app.close();
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('❌ Failed to start worker:', error);
    process.exit(1);
  }
}

bootstrap();
