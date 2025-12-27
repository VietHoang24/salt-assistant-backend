/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CycleService } from '../cycle/cycle.service';
import { GoalsService } from '../goals/goals.service';
import { TelegramService } from '../modules/market/notification/telegram.service';
import dayjs from 'dayjs';

@Injectable()
export class DailyCycleScheduler {
  private readonly logger = new Logger(DailyCycleScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cycleService: CycleService,
    private readonly goalsService: GoalsService,
    private readonly telegramService: TelegramService,
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

  private async runCycle() {
    try {
      // Chạy cycle để crawl và xử lý dữ liệu thị trường
      await this.cycleService.runCycle('daily');

      // Lấy cycle mới nhất vừa chạy
      const latestCycle = await this.prisma.cycles.findFirst({
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

      if (!latestCycle) {
        this.logger.warn('No successful cycle found, skipping notifications');
        return;
      }

      // Lấy chỉ users có telegram_chat_id
      const users = await this.prisma.users.findMany({
        where: {
          telegram_chat_id: {
            not: null,
          },
        },
      });

      if (users.length === 0) {
        this.logger.warn(
          'No users with telegram_chat_id found, skipping notifications',
        );
        return;
      }

      // TODO: In the future, use user.telegram_chat_id instead of TELEGRAM_TEST_CHAT_ID
      const testChatId = process.env.TELEGRAM_TEST_CHAT_ID;
      if (!testChatId) {
        this.logger.warn(
          'TELEGRAM_TEST_CHAT_ID not set, skipping notifications',
        );
        return;
      }

      this.logger.log(
        `Found ${users.length} users to notify (using test chat ID)`,
      );

      // Gửi thông báo cho từng user
      for (const user of users) {
        try {
          await this.sendMarketNotificationToUser(
            user.id,
            testChatId,
            latestCycle,
          );
          this.logger.log(`✅ Notification sent to user ${user.id}`);
        } catch (error) {
          this.logger.error(
            `❌ Failed to send notification to user ${user.id}:`,
            error,
          );

          // Lưu lỗi vào notification_logs
          await this.prisma.notification_logs.create({
            data: {
              user_id: user.id,
              channel: 'telegram',
              type: 'daily_market',
              content: `Failed to send: ${error instanceof Error ? error.message : String(error)}`,
              status: 'failed',
              sent_at: new Date(),
            },
          });
        }
      }

      this.logger.log('✅ Daily cycle completed successfully');
    } catch (error) {
      this.logger.error('❌ Daily cycle failed:', error);
      throw error;
    }
  }

  private async sendMarketNotificationToUser(
    userId: string,
    telegramChatId: string,
    cycle: {
      id: string;
      normalized: Array<{
        asset_code: string;
        asset_type: string;
        value: any;
        unit: string | null;
        effective_at: Date;
      }>;
      signals: Array<{
        signal_type: string;
        asset_code: string | null;
        direction: string | null;
        strength: number | null;
      }>;
      intelligence: Array<{
        context: string;
        confidence: any;
        summary: string;
      }>;
    },
  ) {
    const messageLines: string[] = [];
    messageLines.push('*🌅 Cập nhật thị trường buổi sáng* 📊');
    messageLines.push('');

    // Thông tin giá thị trường
    if (cycle.normalized.length > 0) {
      messageLines.push('*Giá thị trường:*');
      for (const data of cycle.normalized) {
        const formattedValue = this.formatMarketValue(
          data.value,
          data.asset_code,
          data.unit,
        );
        messageLines.push(
          `• ${this.getAssetLabel(data.asset_code)}: ${formattedValue}`,
        );
      }
      messageLines.push('');
    }

    // Signals
    if (cycle.signals.length > 0) {
      messageLines.push('*Tín hiệu thị trường:*');
      for (const signal of cycle.signals) {
        const direction = signal.direction
          ? this.formatDirection(signal.direction)
          : '';
        const strength = signal.strength ? ` (${signal.strength})` : '';
        messageLines.push(
          `• ${this.getAssetLabel(signal.asset_code || 'N/A')}: ${direction}${strength}`,
        );
      }
      messageLines.push('');
    }

    // Intelligence/Context
    if (cycle.intelligence.length > 0) {
      const intel = cycle.intelligence[0];
      messageLines.push('*Phân tích thị trường:*');
      messageLines.push(`Context: ${intel.context}`);
      messageLines.push(`Summary: ${intel.summary}`);
      messageLines.push('');
    }

    // Weekly goals của user
    try {
      const today = dayjs();
      const weeklyGoals = await this.goalsService.getGoalsForYearMonth(
        userId,
        today.year(),
        today.month() + 1,
      );

      if (weeklyGoals.weekly_goals && weeklyGoals.weekly_goals.length > 0) {
        messageLines.push('*📌 Mục tiêu tuần của bạn:*');
        for (const goal of weeklyGoals.weekly_goals) {
          const progressText =
            goal.start_date && goal.end_date
              ? `${dayjs(goal.start_date).format('DD/MM')} - ${dayjs(goal.end_date).format('DD/MM')}`
              : '';
          messageLines.push(
            `• ${goal.title}${progressText ? ` (${progressText})` : ''}`,
          );
          if (goal.description) {
            messageLines.push(`  ${goal.description}`);
          }
        }
        messageLines.push('');
      }
    } catch (error) {
      this.logger.warn(`Failed to get weekly goals for user ${userId}:`, error);
    }

    const messageText = messageLines.join('\n');

    // Gửi qua Telegram
    try {
      await this.telegramService.sendMessage(telegramChatId, messageText);

      // Lưu vào notification_logs với status success
      await this.prisma.notification_logs.create({
        data: {
          user_id: userId,
          channel: 'telegram',
          type: 'daily_market',
          content: messageText,
          status: 'success',
          sent_at: new Date(),
        },
      });
    } catch (error) {
      // Lưu vào notification_logs với status failed
      await this.prisma.notification_logs.create({
        data: {
          user_id: userId,
          channel: 'telegram',
          type: 'daily_market',
          content: messageText,
          status: 'failed',
          sent_at: null,
        },
      });
      throw error;
    }
  }

  private formatMarketValue(
    value: any,
    assetCode: string,
    unit: string | null,
  ): string {
    const numValue =
      typeof value === 'object' && value !== null && 'toNumber' in value
        ? (value as { toNumber: () => number }).toNumber()
        : Number(value);

    if (assetCode.includes('USD') || assetCode.includes('VND')) {
      return `${numValue.toLocaleString('vi-VN')} ${unit || 'VND'}`;
    }
    if (assetCode.includes('BTC') || assetCode.includes('ETH')) {
      return `$${numValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return `${numValue.toLocaleString('vi-VN')} ${unit || ''}`;
  }

  private getAssetLabel(assetCode: string | null): string {
    if (!assetCode) return 'N/A';
    if (assetCode.includes('USDVND')) return 'USD/VND';
    if (assetCode.includes('XAUUSD')) return 'Vàng SJC';
    if (assetCode.includes('BTC')) return 'Bitcoin';
    if (assetCode.includes('ETH')) return 'Ethereum';
    return assetCode;
  }

  private formatDirection(direction: string): string {
    const dir = direction.toLowerCase();
    if (dir === 'up') return '⬆️ Tăng';
    if (dir === 'down') return '⬇️ Giảm';
    return '➡️ Ổn định';
  }
}
