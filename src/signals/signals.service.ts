import { Injectable } from '@nestjs/common';
import { MarketSignal, NormalizedMarketData } from '../type/market.type';

@Injectable()
export class SignalsService {
  generateSignals(
    today: NormalizedMarketData[],
    previous?: NormalizedMarketData[],
  ): MarketSignal[] {
    console.log('today', today);
    console.log('previous', previous);
    // If no previous data, return signals with low confidence
    if (!previous || previous.length === 0) {
      return today.map((t: NormalizedMarketData) => ({
        asset: t.asset,
        direction: 'FLAT' as const,
        magnitude: 0,
        confidence: 0.5, // Low confidence when no comparison data
      }));
    }

    return today.map((t: NormalizedMarketData) => {
      // Find matching previous data by asset and coinType (if applicable)
      const previousData = this.findMatchingPreviousData(t, previous);

      if (!previousData || previousData.value === 0) {
        // No matching previous data or invalid value
        return {
          asset: t.asset,
          direction: 'FLAT' as const,
          magnitude: 0,
          confidence: 0.5,
        };
      }

      // Calculate percentage change
      const percentageChange =
        ((t.value - previousData.value) / previousData.value) * 100;

      // Determine direction based on percentage change
      // Use threshold of 0.1% to filter out noise
      const THRESHOLD = 0.1;
      let direction: 'UP' | 'DOWN' | 'FLAT';
      if (percentageChange > THRESHOLD) {
        direction = 'UP';
      } else if (percentageChange < -THRESHOLD) {
        direction = 'DOWN';
      } else {
        direction = 'FLAT';
      }

      // Magnitude is the absolute percentage change
      const magnitude = Math.abs(percentageChange);

      // Confidence is high (0.9) when we have previous data for comparison
      const confidence = 0.9;

      return {
        asset: t.asset,
        direction,
        magnitude: Math.round(magnitude * 100) / 100, // Round to 2 decimal places
        confidence,
      };
    });
  }

  private findMatchingPreviousData(
    today: NormalizedMarketData,
    previous: NormalizedMarketData[],
  ): NormalizedMarketData | undefined {
    return previous.find((p) => {
      // Match by asset
      if (p.asset !== today.asset) return false;

      // For CRYPTO, also match by coinType
      if (today.asset === 'CRYPTO') {
        return p.coinType === today.coinType;
      }

      // For GOLD, match by source to distinguish buy/sell
      if (today.asset === 'GOLD' && today.source && p.source) {
        const todayIsSell = today.source.includes('SELL');
        const previousIsSell = p.source.includes('SELL');
        return todayIsSell === previousIsSell;
      }

      return true;
    });
  }
}
