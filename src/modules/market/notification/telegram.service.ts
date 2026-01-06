import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly apiUrl = 'https://api.telegram.org';
  private readonly MAX_MESSAGE_LENGTH = 4096;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000; // Start with 1 second
  private readonly REQUEST_TIMEOUT_MS = 30000; // 30 seconds

  private get token() {
    return process.env.TELEGRAM_BOT_TOKEN;
  }

  async sendMessage(chatId: string, text: string): Promise<any> {
    if (!this.token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set');
    }

    // Check message length
    if (text.length > this.MAX_MESSAGE_LENGTH) {
      this.logger.warn(
        `Message too long (${text.length} chars), truncating to ${this.MAX_MESSAGE_LENGTH}`,
      );
      text = text.substring(0, this.MAX_MESSAGE_LENGTH - 3) + '...';
    }

    return this.sendWithRetry(chatId, text, 0);
  }

  private async sendWithRetry(
    chatId: string,
    text: string,
    attempt: number,
    usePlainText = false,
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/bot${this.token}/sendMessage`,
        {
          chat_id: chatId,
          text: usePlainText ? text.replace(/\*/g, '').replace(/_/g, '') : text,
          parse_mode: usePlainText ? undefined : 'Markdown',
        },
        {
          timeout: this.REQUEST_TIMEOUT_MS,
        },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data as
          | { description?: string }
          | undefined;
        const errorMessage = errorData?.description || error.message;
        const errorCode = error.response?.status;

        // Check if it's a network error that should be retried
        const isNetworkError = this.isRetryableError(error);

        // If Markdown parsing fails, try without parse_mode (only on first attempt)
        if (errorCode === 400 && !usePlainText) {
          this.logger.warn('Markdown parse error, retrying without parse_mode');
          return this.sendWithRetry(chatId, text, attempt, true);
        }

        // Retry network errors
        if (isNetworkError && attempt < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt); // Exponential backoff
          this.logger.warn(
            `Network error (attempt ${attempt + 1}/${this.MAX_RETRIES}): ${errorMessage}. Retrying in ${delay}ms...`,
          );
          await this.sleep(delay);
          return this.sendWithRetry(chatId, text, attempt + 1, usePlainText);
        }

        this.logger.error(
          `Telegram API error [${errorCode || 'N/A'}]: ${errorMessage}`,
        );
      }
      throw error;
    }
  }

  private isRetryableError(error: AxiosError): boolean {
    // Network errors that should be retried
    if (!error.response) {
      const code = error.code;
      return (
        code === 'ECONNRESET' ||
        code === 'ETIMEDOUT' ||
        code === 'ENOTFOUND' ||
        code === 'ECONNREFUSED' ||
        code === 'EAI_AGAIN' ||
        error.message.includes('timeout') ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('network')
      );
    }

    // Retry on 5xx server errors
    const status = error.response.status;
    return status >= 500 && status < 600;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
