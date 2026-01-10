import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CycleService } from '../../cycle/cycle.service';
import { MarketNotificationService } from '../../scheduler/services/market-notification.service';
import { DailyQuoteService } from '../daily-quote/daily-quote.service';
import { DailyQuoteResponse } from '../daily-quote/dto/daily-quote.response';
import { CycleData } from '../../scheduler/services/market-message-formatter.service';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
      first_name?: string;
      username?: string;
    };
    date: number;
    text?: string;
  };
}

@Injectable()
export class TelegramWebhookService {
  private readonly logger = new Logger(TelegramWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cycleService: CycleService,
    private readonly marketNotificationService: MarketNotificationService,
    private readonly dailyQuoteService: DailyQuoteService,
  ) {}

  async handleUpdate(update: TelegramUpdate) {
    this.logger.log(`Received telegram update: ${update.update_id}`);

    if (!update.message) {
      return;
    }

    const { message } = update;
    const chatId = message.chat.id.toString();
    const text = message.text || '';

    // Handle /start command with userId parameter
    if (text.startsWith('/start')) {
      const userId = text.split(' ')[1]; // Extract userId from "/start userId"

      if (userId) {
        await this.handleStartCommand(userId, chatId, message);
      } else {
        this.logger.warn(`/start command without userId from chat ${chatId}`);
      }
    }
  }

  private async handleStartCommand(
    userId: string,
    telegramChatId: string,
    _message: TelegramUpdate['message'],
  ) {
    try {
      // Verify user exists
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
      });

      if (!user) {
        this.logger.warn(`User ${userId} not found for telegram chat ${telegramChatId}`);
        return;
      }

      // Check if this is the first time connecting (telegram_chat_id was null)
      const isFirstTime = !user.telegram_chat_id;

      // Update user's telegram_chat_id
      await this.prisma.users.update({
        where: { id: userId },
        data: {
          telegram_chat_id: telegramChatId,
        },
      });

      this.logger.log(
        `Successfully linked telegram chat ${telegramChatId} to user ${userId}`,
      );

      // Run daily cycle and send notification for first-time users
      if (isFirstTime) {
        this.logger.log(
          `First time connection detected for user ${userId}, running daily cycle...`,
        );
        try {
          // Run cycle to get latest market data
          await this.cycleService.runCycle('daily');

          // Get the latest cycle
          const latestCycle = await this.getLatestCycle();

          if (latestCycle) {
            // Convert Prisma cycle to CycleData format
            const cycleData: CycleData = {
              id: latestCycle.id,
              normalized: latestCycle.normalized.map((n) => ({
                asset_code: n.asset_code,
                asset_type: n.asset_type,
                value: n.value,
                unit: n.unit,
                effective_at: n.effective_at,
              })),
              signals: latestCycle.signals.map((s) => ({
                signal_type: s.signal_type,
                asset_code: s.asset_code,
                direction: s.direction,
                strength: s.strength ? Number(s.strength) : null,
              })),
              intelligence: latestCycle.intelligence.map((i) => ({
                context: i.context,
                confidence: i.confidence,
                summary: i.summary,
              })),
            };

            // Get daily quote for user
            let dailyQuote: DailyQuoteResponse | null = null;
            try {
              dailyQuote = await this.dailyQuoteService.getTodayQuoteForUser(
                userId,
              );
            } catch {
              this.logger.warn(
                `Failed to get daily quote for user ${userId}, continuing without it`,
              );
            }

            // Send notification to user
            await this.marketNotificationService.sendNotificationToUser(
              userId,
              telegramChatId,
              cycleData,
              dailyQuote,
            );

            this.logger.log(
              `✅ Daily market notification sent to new user ${userId}`,
            );
          } else {
            this.logger.warn(
              `No successful cycle found to send to user ${userId}`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Error running daily cycle for new user ${userId}:`,
            error,
          );
          // Don't throw - we still want to complete the /start command
        }
      }
    } catch (error) {
      this.logger.error(
        `Error handling /start command for user ${userId}:`,
        error,
      );
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
