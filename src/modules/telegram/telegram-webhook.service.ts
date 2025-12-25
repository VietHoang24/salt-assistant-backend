import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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

  constructor(private readonly prisma: PrismaService) {}

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
    message: TelegramUpdate['message'],
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
    } catch (error) {
      this.logger.error(
        `Error handling /start command for user ${userId}:`,
        error,
      );
      throw error;
    }
  }
}
