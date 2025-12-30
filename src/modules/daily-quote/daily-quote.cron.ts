// Cron job for daily quote generation
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DailyQuoteService } from './daily-quote.service';

@Injectable()
export class DailyQuoteCron {
  private readonly logger = new Logger(DailyQuoteCron.name);

  constructor(private readonly dailyQuoteService: DailyQuoteService) {}

  /**
   * Generate daily quote every day at 6:00 AM (Asia/Ho_Chi_Minh timezone)
   */
  @Cron('0 6 * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
  async generateDailyQuote() {
    this.logger.log('⏳ Cron: Generating daily quote at 6:00 AM...');
    try {
      await this.dailyQuoteService.generateNewQuote();
      this.logger.log('✅ Daily quote generated successfully');
    } catch (error) {
      this.logger.error('❌ Error generating daily quote', error);
    }
  }
}

