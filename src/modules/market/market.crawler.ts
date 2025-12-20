// src/modules/market/market.crawler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MarketService } from './market.service';

@Injectable()
export class MarketCrawler {
  private readonly logger = new Logger(MarketCrawler.name);

  constructor(private readonly marketService: MarketService) {}

  @Cron('47 20 * * *', { timeZone: 'Asia/Bangkok' })
  async handleCron() {
    this.logger.log('⏳ Cron: crawling market data at 20:47 (8:47 PM)...');
    try {
      await this.marketService.notifyMarketToTelegram();
      this.logger.log('✅ Market data sent (20:47)');
    } catch (e) {
      this.logger.error('❌ Error in MarketCrawler', e);
    }
  }
}
