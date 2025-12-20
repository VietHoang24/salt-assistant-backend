export type Asset = 'GOLD' | 'USD' | 'STOCK' | 'CRYPTO';

export interface RawMarketData {
  asset: Asset;
  date: string; // YYYY-MM-DD
  value: number;
  unit: string;
  source: string;
}

export interface NormalizedMarketData {
  asset: Asset;
  date: string; // ISO
  value: number;
  coinType?: string; // 'BTC' | 'ETH' for CRYPTO asset
}

export interface MarketSignal {
  asset: Asset;
  direction: 'UP' | 'DOWN' | 'FLAT';
  magnitude: number; // %
  confidence: number; // 0..1
}

export interface MarketContext {
  context: 'SYSTEM_STRESS' | 'RISK_OFF' | 'NORMAL';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
}
