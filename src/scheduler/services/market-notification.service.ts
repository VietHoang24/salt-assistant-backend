import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramService } from '../../modules/market/notification/telegram.service';
import {
  MarketMessageFormatterService,
  CycleData,
} from './market-message-formatter.service';
import { DailyQuoteService } from '../../modules/daily-quote/daily-quote.service';
import { DailyQuoteResponse } from '../../modules/daily-quote/dto/daily-quote.response';
import axios from 'axios';

@Injectable()
export class MarketNotificationService {
  private readonly logger = new Logger(MarketNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
    private readonly messageFormatter: MarketMessageFormatterService,
    private readonly dailyQuoteService: DailyQuoteService,
  ) {}

  async sendNotificationToUser(
    userId: string,
    telegramChatId: string,
    cycle: CycleData,
    dailyQuote?: DailyQuoteResponse | null,
  ): Promise<void> {
    if (!telegramChatId) {
      throw new Error(`User ${userId} has no telegram_chat_id`);
    }

    const messageText = await this.messageFormatter.formatMarketMessage(
      cycle,
      userId,
      dailyQuote,
    );

    try {
      await this.telegramService.sendMessage(telegramChatId, messageText);

      await this.saveNotificationLog(userId, messageText, 'success');
      this.logger.log(`✅ Notification sent to user ${userId}`);
    } catch (error) {
      await this.saveNotificationLog(userId, messageText, 'failed');
      throw error;
    }
  }

  async sendNotificationsToAllUsers(cycle: CycleData): Promise<void> {
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

    this.logger.log(`Found ${users.length} users to notify`);

    // Send notifications to all users with their individual quotes
    for (const user of users) {
      try {
        if (!user.telegram_chat_id) {
          this.logger.warn(
            `User ${user.id} has no telegram_chat_id, skipping notification`,
          );
          continue;
        }

        // Get today's quote for this specific user
        let dailyQuote: DailyQuoteResponse | null = null;
        try {
          dailyQuote = await this.dailyQuoteService.getTodayQuoteForUser(
            user.id,
          );
        } catch (error) {
          this.logger.warn(
            `⚠️ Failed to get daily quote for user ${user.id}, continuing without it`,
            error,
          );
        }

        await this.sendNotificationToUser(
          user.id,
          user.telegram_chat_id,
          cycle,
          dailyQuote,
        );
      } catch (error) {
        const errorMessage = this.getErrorMessage(error);
        this.logger.error(
          `❌ Failed to send notification to user ${user.id}: ${errorMessage}`,
        );

        await this.saveNotificationLog(
          user.id,
          `Failed to send: ${errorMessage}`,
          'failed',
        );
      }
    }
  }

  private async saveNotificationLog(
    userId: string,
    content: string,
    status: 'success' | 'failed',
  ): Promise<void> {
    await this.prisma.notification_logs.create({
      data: {
        user_id: userId,
        channel: 'telegram',
        type: 'daily_market',
        content,
        status,
        sent_at: status === 'success' ? new Date() : null,
      },
    });
  }

  private getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const statusText = error.response?.statusText;
      const message = error.message;
      return `[${status || 'N/A'}] ${statusText || message}`;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}
