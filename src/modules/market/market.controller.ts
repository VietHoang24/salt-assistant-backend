import { Controller, Get } from '@nestjs/common';
import { MarketService } from './market.service';
import { Public } from '@/auth/public.decorator';
@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('test')
  @Public()
  async test() {
    const data = await this.marketService.test();
    console.log('data', data);
    return data;
  }

  @Get('notify-now')
  @Public()
  async notifyNow() {
    return this.marketService.notifyMarketToTelegram();
  }
}
