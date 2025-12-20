import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly apiUrl = 'https://api.telegram.org';

  private get token() {
    return process.env.TELEGRAM_BOT_TOKEN;
  }

  async sendMessage(chatId: string, text: string) {
    if (!this.token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set1');
    }

    await axios.get(`${this.apiUrl}/bot${this.token}/sendMessage`, {
      params: {
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      },
    });
  }
}
