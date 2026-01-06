import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CycleService } from '../cycle/cycle.service';
import { MarketNotificationService } from './services/market-notification.service';

@Injectable()
export class DailyCycleScheduler {
  private readonly logger = new Logger(DailyCycleScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cycleService: CycleService,
    private readonly notificationService: MarketNotificationService,
  ) {}

  @Cron('0 7 * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
  async handleMorningCycle() {
    this.logger.log('🌅 Starting morning cycle at 7:00 AM...');
    await this.runCycle();
  }

  @Cron('0 22 * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
  async handleEveningCycle() {
    this.logger.log('🌙 Starting evening cycle at 10:00 PM...');
    await this.runCycle();
  }

  // @Cron('* * * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
  // async runCycleEveryMinute() {
  //   try {
  //     this.logger.log('🌙 Starting every minute cycle...');
  //     await this.runCycle();
  //   } catch (error) {
  //     this.logger.error('❌ Every minute cycle failed:', error);
  //     throw error;
  //   }
  // }

  private async runCycle() {
    try {
      // Chạy cycle để crawl và xử lý dữ liệu thị trường
      await this.cycleService.runCycle('daily');

      // Lấy cycle mới nhất vừa chạy
      const latestCycle = await this.getLatestCycle();

      if (!latestCycle) {
        this.logger.warn('No successful cycle found, skipping notifications');
        return;
      }

      // Gửi thông báo cho tất cả users
      await this.notificationService.sendNotificationsToAllUsers(latestCycle);

      this.logger.log('✅ Daily cycle completed successfully');
    } catch (error) {
      this.logger.error('❌ Daily cycle failed:', error);
      throw error;
    }
  }

  private async getLatestCycle() {
    return await this.prisma.cycles.findFirst({
      where: { status: 'success', type: 'daily' },
      orderBy: { started_at: 'desc' },
      include: {
        normalized: {
          orderBy: { effective_at: 'desc' },
          take: 10,
        },
        signals: {
          orderBy: { detected_at: 'desc' },
          take: 10,
        },
        intelligence: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    });
  }
}

