import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

export interface ImageRenderJob {
  type: 'loyalty-card' | 'voucher';
  familyId?: string;
  voucherId?: string;
  language: 'EN' | 'PT';
}

@Processor('image-render')
export class ImageRenderProcessor extends WorkerHost {
  private readonly logger = new Logger(ImageRenderProcessor.name);

  async process(job: Job<ImageRenderJob>): Promise<void> {
    const { type, familyId, voucherId, language } = job.data;
    
    this.logger.log(`Processing ${type} image generation job: ${job.id}`);
    
    try {
      // TODO: Implement actual image generation
      // This would call the ImagesService from the main app
      // For now, we'll just log the job
      
      if (type === 'loyalty-card' && familyId) {
        this.logger.log(`Generating loyalty card for family: ${familyId} (${language})`);
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else if (type === 'voucher' && voucherId) {
        this.logger.log(`Generating voucher: ${voucherId} (${language})`);
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      this.logger.log(`✅ Image generation job completed: ${job.id}`);
    } catch (error) {
      this.logger.error(`❌ Image generation job failed: ${job.id}`, error);
      throw error;
    }
  }
}
