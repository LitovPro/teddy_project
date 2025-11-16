import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ImageProcessorService } from '../../image-processor/image-processor.service';

@Processor('image-render')
export class ImageQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(ImageQueueProcessor.name);

    constructor(private imageProcessorService: ImageProcessorService) {
        super();
    }

    async process(job: Job): Promise<string> {
        const { type, data } = job.data;

        this.logger.log(`Processing image job: ${type} (${job.id})`);

        try {
            switch (type) {
                case 'loyalty-card':
                    return await this.imageProcessorService.generateLoyaltyCard(data);
                case 'voucher':
                    return await this.imageProcessorService.generateVoucher(data);
                default:
                    throw new Error(`Unknown image type: ${type}`);
            }
        } catch (error) {
            this.logger.error(`Failed to process image job ${job.id}:`, error);
            throw error;
        }
    }

    @OnWorkerEvent('completed')
    onCompleted(job: Job) {
        this.logger.log(`Image job ${job.id} completed successfully`);
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job, err: Error) {
        this.logger.error(`Image job ${job.id} failed:`, err.message);
    }
}
