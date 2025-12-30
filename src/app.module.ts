import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { GoalsModule } from './goals/goals.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ScheduleModule } from '@nestjs/schedule';
import { MarketModule } from './modules/market/market.module';
import { CycleModule } from './cycle/cycle.module';
import { CrawlModule } from './crawl/crawl.module';
import { NormalizeModule } from './normalize/normalize.module';
import { SignalsModule } from './signals/signals.module';
import { IntelligenceModule } from './intelligence/intelligence.module';
import { NotificationModule } from './notification/notification.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { DailyQuoteModule } from './modules/daily-quote/daily-quote.module';

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    AuthModule,
    JwtModule,
    GoalsModule,
    ScheduleModule.forRoot(),
    MarketModule,
    CycleModule,
    CrawlModule,
    NormalizeModule,
    SignalsModule,
    IntelligenceModule,
    NotificationModule,
    SchedulerModule,
    TelegramModule,
    DailyQuoteModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
