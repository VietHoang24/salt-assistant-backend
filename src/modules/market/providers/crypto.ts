import axios from 'axios';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CryptoProvider {
  private readonly logger = new Logger(CryptoProvider.name);
  private readonly cryptoApiUrl =
    'https://api.coingecko.com/api/v3/simple/price';

  async getPrices(): Promise<{
    btc: number | null;
    eth: number | null;
  }> {
    try {
      const response = await axios.get<{
        bitcoin?: { usd?: number };
        ethereum?: { usd?: number };
      }>(this.cryptoApiUrl, {
        params: {
          ids: 'bitcoin,ethereum',
          vs_currencies: 'usd',
        },
      });

      const btcPrice = response.data?.bitcoin?.usd;
      const ethPrice = response.data?.ethereum?.usd;

      return {
        btc: btcPrice ? Number(btcPrice) : null,
        eth: ethPrice ? Number(ethPrice) : null,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching crypto prices: ${this.getErrorMessage(error)}`,
      );
      return { btc: null, eth: null };
    }
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
