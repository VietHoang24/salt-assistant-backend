import { Module } from '@nestjs/common';
import { TelegramWebhookController } from './telegram-webhook.controller';
import { TelegramWebhookService } from './telegram-webhook.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { CycleModule } from '../../cycle/cycle.module';
import { SchedulerModule } from '../../scheduler/scheduler.module';
import { DailyQuoteModule } from '../daily-quote/daily-quote.module';

@Module({
  imports: [PrismaModule, CycleModule, SchedulerModule, DailyQuoteModule],
  controllers: [TelegramWebhookController],
  providers: [TelegramWebhookService],
})
export class TelegramModule {}
