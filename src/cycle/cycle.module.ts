import { Module } from '@nestjs/common';
import { CycleService } from './cycle.service';
import { CrawlService } from '../crawl/crawl.service';
import { NormalizeService } from '../normalize/normalize.service';
import { SignalsService } from '../signals/signals.service';
import { IntelligenceService } from '../intelligence/intelligence.service';
import { NotificationService } from '../notification/notification.service';
import { CycleController } from './circle.controller';

@Module({
  providers: [
    CycleService,
    CrawlService,
    NormalizeService,
    SignalsService,
    IntelligenceService,
    NotificationService,
  ],
  controllers: [CycleController],
  exports: [CycleService],
})
export class CycleModule {}
