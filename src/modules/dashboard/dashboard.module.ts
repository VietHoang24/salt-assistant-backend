import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { GoalsModule } from '@/goals/goals.module';
import { DailyQuoteModule } from '@/modules/daily-quote/daily-quote.module';
import { MarketModule } from '@/modules/market/market.module';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [GoalsModule, DailyQuoteModule, MarketModule, PrismaModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

