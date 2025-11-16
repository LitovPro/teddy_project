import { Module } from '@nestjs/common';
import { ConsentService } from './consent.service';
import { DataDeletionService } from './data-deletion.service';
import { GdprController } from './gdpr.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TwilioModule } from '../twilio/twilio.module';
import { I18nModule } from '../i18n/i18n.module';

@Module({
    imports: [PrismaModule, TwilioModule, I18nModule],
    controllers: [GdprController],
    providers: [ConsentService, DataDeletionService],
    exports: [ConsentService, DataDeletionService],
})
export class GdprModule { }
