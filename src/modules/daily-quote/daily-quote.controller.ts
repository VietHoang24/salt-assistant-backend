// Daily quote controller
import { Controller, Get, Post, Query } from '@nestjs/common';
import { DailyQuoteService } from './daily-quote.service';
import { DailyQuoteResponse } from './dto/daily-quote.response';
import { Public } from '@/auth/public.decorator';

@Controller('daily-quote')
export class DailyQuoteController {
  constructor(private readonly dailyQuoteService: DailyQuoteService) {}

  @Get()
  @Public()
  async getTodayQuote(): Promise<DailyQuoteResponse> {
    return this.dailyQuoteService.getTodayQuote();
  }

  @Post('generate')
  @Public()
  async generateNewQuote(
    @Query('context') context?: string,
  ): Promise<DailyQuoteResponse> {
    return this.dailyQuoteService.generateNewQuote(context);
  }
}

