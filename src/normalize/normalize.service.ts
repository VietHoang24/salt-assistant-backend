import { Injectable } from '@nestjs/common';
import { RawMarketData, NormalizedMarketData } from '../type/market.type';

@Injectable()
export class NormalizeService {
  normalize(data: RawMarketData[]): NormalizedMarketData[] {
    return data.map((d) => {
      const normalized: NormalizedMarketData = {
        asset: d.asset,
        date: new Date(d.date).toISOString(),
        value: Number(d.value),
        source: d.source, // Preserve source to distinguish buy/sell for GOLD
      };

      // Extract coin type from source for CRYPTO assets
      if (d.asset === 'CRYPTO' && d.source) {
        if (d.source.includes('BTC')) {
          normalized.coinType = 'BTC';
        } else if (d.source.includes('ETH')) {
          normalized.coinType = 'ETH';
        }
      }

      return normalized;
    });
  }
}
