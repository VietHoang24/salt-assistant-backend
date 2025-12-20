import { Injectable } from '@nestjs/common';
import { MarketSignal, NormalizedMarketData } from '../type/market.type';

@Injectable()
export class SignalsService {
  generateSignals(
    today: NormalizedMarketData[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _yesterday?: NormalizedMarketData[],
  ): MarketSignal[] {
    // V0: mock yesterday = -1%
    return today.map((t: NormalizedMarketData) => {
      const magnitude = 1.5;

      return {
        asset: t.asset,
        direction: magnitude >= 1 ? 'UP' : 'FLAT',
        magnitude,
        confidence: 0.8,
      };
    });
  }
}
