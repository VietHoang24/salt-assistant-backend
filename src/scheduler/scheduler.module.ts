import { Module } from '@nestjs/common';
import { DailyCycleScheduler } from './dailyCycle';
import { CycleModule } from '../cycle/cycle.module';
import { GoalsModule } from '../goals/goals.module';
import { MarketModule } from '../modules/market/market.module';

@Module({
  imports: [CycleModule, GoalsModule, MarketModule],
  providers: [DailyCycleScheduler],
})
export class SchedulerModule {}
