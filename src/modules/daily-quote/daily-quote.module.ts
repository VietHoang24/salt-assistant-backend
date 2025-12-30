import { Module } from '@nestjs/common';
import { DailyQuoteController } from './daily-quote.controller';
import { DailyQuoteService } from './daily-quote.service';
import { DailyQuoteRepository } from './daily-quote.repository';
import { DailyQuoteCron } from './daily-quote.cron';
import { OpenAIModule } from '@/integrations/openai/openai.module';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [OpenAIModule, PrismaModule],
  controllers: [DailyQuoteController],
  providers: [DailyQuoteService, DailyQuoteRepository, DailyQuoteCron],
  exports: [DailyQuoteService],
})
export class DailyQuoteModule {}

