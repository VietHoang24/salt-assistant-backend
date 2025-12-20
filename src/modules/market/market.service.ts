import { Injectable } from '@nestjs/common';
import { CryptoProvider } from './providers/crypto';
import { GoldProvider } from './providers/gold';
import { TelegramService } from './notification/telegram.service';

@Injectable()
export class MarketService {
  constructor(
    private gold: GoldProvider,
    private crypto: CryptoProvider,
    private readonly telegram: TelegramService,
  ) {}

  async test() {
    return {
      gold: await this.gold.getGoldPrice(),
      crypto: await this.crypto.getPrices(),
    };
  }

  async getMarketSnapshot() {
    const gold = await this.gold.getGoldPrice();
    const crypto = await this.crypto.getPrices();
    return { gold, crypto };
  }

  // 👉 Hàm mới: gọi getMarketSnapshot + gửi Telegram
  async notifyMarketToTelegram() {
    const { gold, crypto } = await this.getMarketSnapshot();

    const lines: string[] = [];
    lines.push('*Cập nhật thị trường* 📊');

    if (gold) {
      lines.push(
        '',
        '*Vàng SJC:*',
        `• Mua: ${gold.buy.toLocaleString('vi-VN')} VND`,
        `• Bán: ${gold.sell.toLocaleString('vi-VN')} VND`,
        `• Cập nhật: ${gold.updatedAt}`,
      );
    } else {
      lines.push('', 'Không lấy được giá vàng 🥲');
    }

    lines.push(
      '',
      '*Crypto:*',
      `• BTC: ${crypto.btc ? crypto.btc + ' VND' : 'N/A'}`,
      `• ETH: ${crypto.eth ? crypto.eth + ' VND' : 'N/A'}`,
    );

    const text = lines.join('\n');
    const chatId = process.env.TELEGRAM_TEST_CHAT_ID!;

    await this.telegram.sendMessage(chatId, text);

    return { ok: true };
  }
}
