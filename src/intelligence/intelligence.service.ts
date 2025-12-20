import { Injectable } from '@nestjs/common';
import { MarketContext, MarketSignal } from '../type/market.type';

@Injectable()
export class IntelligenceService {
  detectContext(signals: MarketSignal[]): MarketContext {
    const goldUp = signals.find(
      (s: MarketSignal) => s.asset === 'GOLD' && s.direction === 'UP',
    );
    const usdUp = signals.find(
      (s: MarketSignal) => s.asset === 'USD' && s.direction === 'UP',
    );
    const stockDown = signals.find(
      (s: MarketSignal) => s.asset === 'STOCK' && s.direction === 'DOWN',
    );

    if (goldUp && usdUp) {
      return {
        context: 'SYSTEM_STRESS',
        severity: 'HIGH',
        confidence: 0.9,
      };
    }

    if (goldUp && stockDown) {
      return {
        context: 'RISK_OFF',
        severity: 'MEDIUM',
        confidence: 0.8,
      };
    }

    return {
      context: 'NORMAL',
      severity: 'LOW',
      confidence: 0.6,
    };
  }
}
