import { Injectable } from '@nestjs/common';
import {
  MarketContext,
  MarketSignal,
  NormalizedMarketData,
} from '../type/market.type';

@Injectable()
export class NotificationService {
  notify(
    signals: MarketSignal[],
    context: MarketContext,
    normalized: NormalizedMarketData[],
  ) {
    console.log('============================');
    console.log('📊 Daily Market Pulse');
    console.log('');

    // Group normalized data by asset and coinType
    const pricesByAsset = this.groupByAssetAndCoinType(normalized);

    // Track which normalized entries have been matched
    const matchedIndices = new Set<number>();

    // Log chi tiết giá và signals
    signals.forEach((signal) => {
      // Find matching normalized data entry (not yet matched)
      let matchingNormalized: NormalizedMarketData | undefined;
      let matchingIndex = -1;

      for (let i = 0; i < normalized.length; i++) {
        if (matchedIndices.has(i)) continue;

        const n = normalized[i];
        if (n.asset === signal.asset) {
          if (signal.asset === 'CRYPTO') {
            // For CRYPTO, we need to match each signal with a different coin
            // Since signals are generated in order, match first unmatched CRYPTO
            matchingNormalized = n;
            matchingIndex = i;
            break;
          } else {
            matchingNormalized = n;
            matchingIndex = i;
            break;
          }
        }
      }

      if (matchingNormalized) {
        matchedIndices.add(matchingIndex);
        const coinType: string | undefined =
          'coinType' in matchingNormalized &&
          typeof matchingNormalized.coinType === 'string'
            ? matchingNormalized.coinType
            : undefined;
        const formattedValue = this.formatValue(
          matchingNormalized.value,
          signal.asset,
          coinType,
        );
        console.log(
          `- ${formattedValue} | ${signal.direction} (${signal.magnitude.toFixed(2)}%) | confidence: ${signal.confidence.toFixed(2)}`,
        );
      } else {
        console.log(
          `- ${signal.asset}: N/A | ${signal.direction} (${signal.magnitude.toFixed(2)}%) | confidence: ${signal.confidence.toFixed(2)}`,
        );
      }
    });

    // Log tất cả giá nếu có asset không có signal
    const keysWithPrices = new Set(pricesByAsset.keys());
    const keysWithSignals = new Set(
      signals.map((s) =>
        s.asset === 'CRYPTO'
          ? this.getCryptoKeyFromNormalized(normalized, s)
          : s.asset,
      ),
    );

    keysWithPrices.forEach((key) => {
      if (!keysWithSignals.has(key)) {
        const prices = pricesByAsset.get(key) || [];
        const latestPrice = prices[prices.length - 1];
        if (latestPrice) {
          const coinType: string | undefined =
            'coinType' in latestPrice &&
            typeof latestPrice.coinType === 'string'
              ? latestPrice.coinType
              : undefined;
          const formattedValue = this.formatValue(
            latestPrice.value,
            latestPrice.asset,
            coinType,
          );
          console.log(`- ${formattedValue} | No signal`);
        }
      }
    });

    console.log('');
    console.log(`Market Context: ${context.context}`);
    console.log(`Severity: ${context.severity}`);
    console.log(`Confidence: ${context.confidence.toFixed(2)}`);
    console.log('============================');
  }

  private groupByAssetAndCoinType(
    data: NormalizedMarketData[],
  ): Map<string, NormalizedMarketData[]> {
    const grouped = new Map<string, NormalizedMarketData[]>();

    for (const item of data) {
      const key =
        item.asset === 'CRYPTO' && item.coinType
          ? `${item.asset}_${item.coinType}`
          : item.asset;
      const existing = grouped.get(key) || [];
      existing.push(item);
      grouped.set(key, existing);
    }

    // Sort by date for each asset
    for (const [, values] of grouped.entries()) {
      values.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
    }

    return grouped;
  }

  private getCryptoKeyFromNormalized(
    normalized: NormalizedMarketData[],
    signal: MarketSignal,
  ): string {
    // Find matching normalized data for this signal
    // Since signals are generated from normalized data, find the one that matches
    const matching = normalized.find(
      (n) =>
        n.asset === signal.asset &&
        (signal.asset !== 'CRYPTO' || n.coinType),
    );
    return matching && matching.asset === 'CRYPTO' && matching.coinType
      ? `${matching.asset}_${matching.coinType}`
      : signal.asset;
  }

  private formatValue(value: number, asset: string, coinType?: string): string {
    if (asset === 'USD') {
      return `${value.toLocaleString('vi-VN')} VND`;
    }
    if (asset === 'GOLD') {
      return `${value.toLocaleString('vi-VN')} VND`;
    }
    if (asset === 'CRYPTO') {
      const coinLabel = coinType || 'CRYPTO';
      return `${coinLabel}: $${value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} USD`;
    }
    return `${value.toLocaleString('vi-VN')}`;
  }
}
