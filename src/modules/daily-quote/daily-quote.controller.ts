// Daily quote controller
import { Controller, Get, Post, Query } from '@nestjs/common';
import { DailyQuoteService } from './daily-quote.service';
import { DailyQuoteResponse } from './dto/daily-quote.response';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('daily-quote')
export class DailyQuoteController {
  constructor(private readonly dailyQuoteService: DailyQuoteService) {}

  @Get()
  async getTodayQuote(
    @CurrentUser() user: { sub: string },
  ): Promise<DailyQuoteResponse> {
    return this.dailyQuoteService.getTodayQuoteForUser(user.sub);
  }

  @Post('generate')
  async generateNewQuote(
    @CurrentUser() user: { sub: string },
    @Query('context') context?: string,
  ): Promise<DailyQuoteResponse> {
    return this.dailyQuoteService.generateNewQuote(user.sub, context);
  }
}

