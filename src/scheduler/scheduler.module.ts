import { Module } from '@nestjs/common';
import { DailyCycleScheduler } from './dailyCycle';
import { CycleModule } from '../cycle/cycle.module';
import { GoalsModule } from '../goals/goals.module';
import { MarketModule } from '../modules/market/market.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DailyQuoteModule } from '../modules/daily-quote/daily-quote.module';
import { MarketNotificationService } from './services/market-notification.service';
import { MarketMessageFormatterService } from './services/market-message-formatter.service';

@Module({
  imports: [CycleModule, GoalsModule, MarketModule, PrismaModule, DailyQuoteModule],
  providers: [
    DailyCycleScheduler,
    MarketNotificationService,
    MarketMessageFormatterService,
  ],
  exports: [MarketNotificationService],
})
export class SchedulerModule {}
