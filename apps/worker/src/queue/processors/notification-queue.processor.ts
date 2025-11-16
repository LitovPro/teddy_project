import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NotificationService } from '../../notification/notification.service';

@Processor('notifications')
export class NotificationQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(NotificationQueueProcessor.name);

    constructor(private notificationService: NotificationService) {
        super();
    }

    async process(job: Job): Promise<string> {
        const { type, data } = job.data;

        this.logger.log(`Processing notification job: ${type} (${job.id})`);

        try {
            switch (type) {
                case 'broadcast':
                    return await this.notificationService.sendBroadcast(data);
                case 'visit-confirmation':
                    return await this.notificationService.sendVisitConfirmation(data);
                case 'voucher-issued':
                    return await this.notificationService.sendVoucherIssued(data);
                default:
                    throw new Error(`Unknown notification type: ${type}`);
            }
        } catch (error) {
            this.logger.error(`Failed to process notification job ${job.id}:`, error);
            throw error;
        }
    }

    @OnWorkerEvent('completed')
    onCompleted(job: Job) {
        this.logger.log(`Notification job ${job.id} completed successfully`);
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job, err: Error) {
        this.logger.error(`Notification job ${job.id} failed:`, err.message);
    }
}
