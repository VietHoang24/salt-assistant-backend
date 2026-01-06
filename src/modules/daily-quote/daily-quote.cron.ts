// Cron job for daily quote generation
// Note: Quotes are now generated on-demand per user when they access the dashboard
// This cron job is kept for potential future use (e.g., pre-generating quotes for all users)
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { DailyQuoteService } from './daily-quote.service';

@Injectable()
export class DailyQuoteCron {
  private readonly logger = new Logger(DailyQuoteCron.name);

  constructor(
    private readonly dailyQuoteService: DailyQuoteService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Optional: Pre-generate quotes for all active users
   * This can be enabled if needed in the future
   */
  // @Cron('0 6 * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
  // async generateDailyQuotesForAllUsers() {
  //   this.logger.log('⏳ Cron: Generating daily quotes for all users at 6:00 AM...');
  //   try {
  //     const users = await this.prisma.users.findMany({
  //       select: { id: true },
  //     });
  //
  //     for (const user of users) {
  //       try {
  //         await this.dailyQuoteService.getTodayQuoteForUser(user.id);
  //       } catch (error) {
  //         this.logger.error(`Failed to generate quote for user ${user.id}`, error);
  //       }
  //     }
  //
  //     this.logger.log(`✅ Daily quotes generated for ${users.length} users`);
  //   } catch (error) {
  //     this.logger.error('❌ Error generating daily quotes', error);
  //   }
  // }
}

