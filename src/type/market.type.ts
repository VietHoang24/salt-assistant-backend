export type Asset =
  | 'GOLD'
  | 'USD'
  | 'STOCK'
  | 'CRYPTO'
  | 'OIL'
  | 'INTERNATIONAL_GOLD';

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
  source?: string; // Preserve source for matching (e.g., 'BTMC' vs 'BTMC_SELL' for GOLD)
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
