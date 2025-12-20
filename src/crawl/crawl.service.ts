import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { RawMarketData } from '../type/market.type';

@Injectable()
export class CrawlService {
  private readonly logger = new Logger(CrawlService.name);
  private readonly goldApiUrl =
    'http://api.btmc.vn/api/BTMCAPI/getpricebtmc?key=3kd8ub1llcg9t45hnoh8hmn7t5kc2v';
  private readonly exchangeRateApiUrl =
    'https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx?b=8';
  private readonly cryptoApiUrl =
    'https://api.coingecko.com/api/v3/simple/price';
  private readonly vnIndexApiUrl =
    'https://finfo-api.vndirect.com.vn/v4/stock_prices/';

  async crawlAll(): Promise<RawMarketData[]> {
    const results: RawMarketData[] = [];
    const today = new Date().toISOString().split('T')[0];

    try {
      const [gold, usd, crypto] = await Promise.allSettled([
        this.crawlGold(),
        this.crawlUsdRate(),
        this.crawlCrypto(),
        // this.crawlStockIndex(), // Tạm thời tắt crawl chứng khoán
      ]);

      if (gold.status === 'fulfilled' && gold.value) {
        results.push({
          asset: 'GOLD',
          date: today,
          value: gold.value.buy,
          unit: 'VND',
          source: 'BTMC',
        });
        results.push({
          asset: 'GOLD',
          date: today,
          value: gold.value.sell,
          unit: 'VND',
          source: 'BTMC_SELL',
        });
      }

      if (usd.status === 'fulfilled' && usd.value) {
        results.push({
          asset: 'USD',
          date: today,
          value: usd.value,
          unit: 'VND',
          source: 'VIETCOMBANK',
        });
      }

      if (crypto.status === 'fulfilled' && crypto.value) {
        if (crypto.value.btc) {
          results.push({
            asset: 'CRYPTO',
            date: today,
            value: crypto.value.btc,
            unit: 'USD',
            source: 'COINGECKO_BTC',
          });
        }
        if (crypto.value.eth) {
          results.push({
            asset: 'CRYPTO',
            date: today,
            value: crypto.value.eth,
            unit: 'USD',
            source: 'COINGECKO_ETH',
          });
        }
      }

      // Tạm thời tắt crawl chứng khoán
      // if (stock.status === 'fulfilled' && stock.value) {
      //   results.push({
      //     asset: 'STOCK',
      //     date: today,
      //     value: stock.value,
      //     unit: 'POINT',
      //     source: 'VNDIRECT',
      //   });
      // }
    } catch (error) {
      this.logger.error(`Error in crawlAll: ${this.getErrorMessage(error)}`);
    }

    return results;
  }

  private async crawlGold(): Promise<{ buy: number; sell: number } | null> {
    try {
      const response = await axios.get<{
        DataList?: { Data?: Array<Record<string, unknown>> };
      }>(this.goldApiUrl);
      const items = response.data?.DataList?.Data;

      if (!Array.isArray(items)) return null;

      let sjc: Record<string, unknown> | null = null;
      for (const item of items) {
        for (const key in item) {
          if (
            key.startsWith('@n_') &&
            typeof item[key] === 'string' &&
            item[key].includes('VÀNG MIẾNG SJC')
          ) {
            sjc = item;
            break;
          }
        }
        if (sjc) break;
      }

      if (!sjc) return null;

      const row = sjc['@row'];
      if (typeof row !== 'string' && typeof row !== 'number') return null;

      const buyKey = `@pb_${row}`;
      const sellKey = `@ps_${row}`;
      const buyValue = sjc[buyKey];
      const sellValue = sjc[sellKey];

      return {
        buy: Number(buyValue),
        sell: Number(sellValue),
      };
    } catch (error) {
      this.logger.error(
        `Error crawling gold price: ${this.getErrorMessage(error)}`,
      );
      return null;
    }
  }

  private async crawlUsdRate(): Promise<number | null> {
    try {
      const response = await axios.get<string>(this.exchangeRateApiUrl, {
        responseType: 'text',
      });

      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
      });

      interface ExrateItem {
        '@_CurrencyCode': string;
        '@_Transfer'?: string;
        '@_Buy'?: string;
        '@_Sell'?: string;
      }

      interface ExrateListData {
        ExrateList?: {
          Exrate?: ExrateItem | ExrateItem[];
        };
      }

      const parsed = parser.parse(response.data) as ExrateListData;
      const exrateList = parsed?.ExrateList;

      if (!exrateList) return null;

      const exrates = Array.isArray(exrateList.Exrate)
        ? exrateList.Exrate
        : exrateList.Exrate
          ? [exrateList.Exrate]
          : [];

      const usdExrate = exrates.find(
        (exrate: ExrateItem) => exrate['@_CurrencyCode'] === 'USD',
      );

      if (!usdExrate) return null;

      const transferRate = usdExrate['@_Transfer'];
      if (!transferRate || transferRate === '-') return null;

      const rate = parseFloat(String(transferRate).replace(/,/g, ''));
      return isNaN(rate) ? null : rate;
    } catch (error) {
      this.logger.error(
        `Error crawling USD/VND rate: ${this.getErrorMessage(error)}`,
      );
      return null;
    }
  }

  private async crawlCrypto(): Promise<{
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
        `Error crawling crypto prices: ${this.getErrorMessage(error)}`,
      );
      return { btc: null, eth: null };
    }
  }

  private async crawlStockIndex(): Promise<number | null> {
    try {
      const response = await axios.get<{
        data?: Array<{ price?: number }>;
      }>(this.vnIndexApiUrl, {
        params: {
          q: 'code:VNINDEX',
          size: 1,
        },
      });

      const data = response.data?.data;
      if (Array.isArray(data) && data.length > 0) {
        const indexValue = data[0]?.price;
        return indexValue ? Number(indexValue) : null;
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Error crawling VN-Index: ${this.getErrorMessage(error)}`,
      );
      return null;
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
