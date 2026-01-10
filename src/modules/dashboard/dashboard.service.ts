// Dashboard service
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GoalsService } from '@/goals/goals.service';
import { DailyQuoteService } from '@/modules/daily-quote/daily-quote.service';
import { MarketService } from '@/modules/market/market.service';
import {
  DashboardResponse,
  WeeklyGoalDTO,
  QuoteDTO,
  InvestmentDTO,
  NewsDTO,
} from './dto/dashboard.response';
import dayjs from 'dayjs';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly goalsService: GoalsService,
    private readonly dailyQuoteService: DailyQuoteService,
    private readonly marketService: MarketService,
  ) {}

  async getDashboardData(userId: string): Promise<DashboardResponse> {
    const today = dayjs();
    const year = today.year();
    const month = today.month() + 1;

    // Fetch all data in parallel
    const [goalsData, quote, marketSnapshot, newsToday] = await Promise.all([
      this.getWeeklyGoals(userId, year, month),
      this.getDailyQuote(userId),
      this.getInvestmentData(),
      this.getTodayNews(),
    ]);

    return {
      weeklyGoals: goalsData,
      quoteOfTheDay: quote,
      investment: marketSnapshot,
      newsToday: newsToday.news,
      hasMoreNews: newsToday.hasMore,
    };
  }

  private async getWeeklyGoals(
    userId: string,
    year: number,
    month: number,
  ): Promise<WeeklyGoalDTO[]> {
    try {
      const goalsData = await this.goalsService.getGoalsForYearMonth(
        userId,
        year,
        month,
      );

      const weeklyGoals = goalsData.weekly_goals || [];

      // Calculate progress for each goal
      return weeklyGoals.map((goal) => {
        // Calculate progress based on dates
        const startDate = dayjs(goal.start_date);
        const endDate = dayjs(goal.end_date);
        const today = dayjs();
        const totalDays = endDate.diff(startDate, 'day');
        const daysPassed = today.diff(startDate, 'day');
        const progress = Math.min(
          Math.max(Math.round((daysPassed / totalDays) * 100), 0),
          100,
        );

        return {
          id: goal.id,
          title: goal.title,
          description: goal.description || undefined,
          progress,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        };
      });
    } catch (error) {
      this.logger.error('Failed to get weekly goals', error);
      return [];
    }
  }

  private async getDailyQuote(userId: string): Promise<QuoteDTO | null> {
    try {
      const quote = await this.dailyQuoteService.getTodayQuoteForUser(userId);
      return {
        content: quote.content,
        author: quote.author || undefined,
      };
    } catch (error) {
      this.logger.error('Failed to get daily quote', error);
      return null;
    }
  }

  private async getInvestmentData(): Promise<InvestmentDTO> {
    try {
      const marketSnapshot = await this.marketService.getMarketSnapshot();
      const gold = marketSnapshot.gold;
      const crypto = marketSnapshot.crypto;

      // Get latest market_data from DB for USD/VND rate
      const latestMarketData = await this.prisma.market_data.findFirst({
        orderBy: { created_at: 'desc' },
      });

      return {
        gold: {
          buy: gold?.buy ? Number(gold.buy) : null,
          sell: gold?.sell ? Number(gold.sell) : null,
        },
        crypto: {
          btc: crypto?.btc ? Number(crypto.btc) : null,
          eth: crypto?.eth ? Number(crypto.eth) : null,
        },
        forex: {
          usdVnd: latestMarketData?.usd_vnd_rate
            ? Number(latestMarketData.usd_vnd_rate)
            : null,
        },
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get investment data', error);
      return {
        gold: { buy: null, sell: null },
        crypto: { btc: null, eth: null },
        forex: { usdVnd: null },
        updatedAt: new Date().toISOString(),
      };
    }
  }

  private async getTodayNews(): Promise<{
    news: NewsDTO[];
    hasMore: boolean;
  }> {
    try {
      const today = dayjs().startOf('day');
      const tomorrow = today.add(1, 'day');

      const news = await this.prisma.news.findMany({
        where: {
          created_at: {
            gte: today.toDate(),
            lt: tomorrow.toDate(),
          },
        },
        orderBy: { created_at: 'desc' },
        take: 10, // Limit to 10 for dashboard
      });

      // Check if there are more news
      const totalCount = await this.prisma.news.count({
        where: {
          created_at: {
            gte: today.toDate(),
            lt: tomorrow.toDate(),
          },
        },
      });

      return {
        news: news.map((item) => ({
          id: item.id,
          title: item.title,
          source: item.source,
          publishedAt: item.published_at
            ? item.published_at.toISOString()
            : item.created_at.toISOString(),
        })),
        hasMore: totalCount > 10,
      };
    } catch (error) {
      this.logger.error('Failed to get today news', error);
      return { news: [], hasMore: false };
    }
  }
}

