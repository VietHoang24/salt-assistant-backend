import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MarketCrawler } from './market.crawler';
import { GoldProvider } from './providers/gold';
import { CryptoProvider } from './providers/crypto';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { TelegramService } from './notification/telegram.service';

@Module({
  providers: [
    PrismaService,
    MarketCrawler,
    GoldProvider,
    CryptoProvider,
    MarketService,
    TelegramService,
  ],
  controllers: [MarketController],
  exports: [TelegramService],
})
export class MarketModule {}
