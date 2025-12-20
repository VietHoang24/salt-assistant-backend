/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrawlService } from '../crawl/crawl.service';
import { NormalizeService } from '../normalize/normalize.service';
import { SignalsService } from '../signals/signals.service';
import { IntelligenceService } from '../intelligence/intelligence.service';
import { NotificationService } from '../notification/notification.service';
import {
  RawMarketData,
  NormalizedMarketData,
  MarketSignal,
  MarketContext,
} from '../type/market.type';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CycleService {
  private readonly logger = new Logger(CycleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crawlService: CrawlService,
    private readonly normalizeService: NormalizeService,
    private readonly signalsService: SignalsService,
    private readonly intelligenceService: IntelligenceService,
    private readonly notificationService: NotificationService,
  ) {}

  async runCycle(type: string = 'daily') {
    let cycleId: string | undefined;

    try {
      // Tạo cycle record với status "running"
      const cycle = await this.prisma.cycles.create({
        data: {
          type,
          status: 'running',
        },
      });
      cycleId = cycle.id;
      if (!cycleId) {
        throw new Error('Failed to create cycle: cycle ID is undefined');
      }
      this.logger.log(`Cycle ${cycleId} started`);

      // Crawl raw data
      const rawData = await this.crawlService.crawlAll();
      this.logger.log(`Crawled ${rawData.length} raw data items`);

      if (rawData.length === 0) {
        this.logger.warn('No raw data crawled, skipping cycle');
        await this.prisma.cycles.update({
          where: { id: cycleId },
          data: {
            status: 'success',
            note: 'No data to process',
            finished_at: new Date(),
          },
        });
        return;
      }

      // Lưu raw data vào database
      const rawDataMap = await this.saveRawData(cycleId, rawData);
      this.logger.log(`Saved ${rawDataMap.size} raw data records`);

      // Normalize data
      const normalizedData = this.normalizeService.normalize(rawData);
      this.logger.log(`Normalized ${normalizedData.length} data items`);

      // Lưu normalized data vào database với mapping chính xác
      const normalizedDataMap = await this.saveNormalizedData(
        cycleId,
        normalizedData,
        rawData,
        rawDataMap,
      );
      this.logger.log(`Saved ${normalizedDataMap.size} normalized data records`);

      // Generate signals
      const signals = this.signalsService.generateSignals(normalizedData);
      this.logger.log(`Generated ${signals.length} signals`);

      // Lưu signals vào database với mapping chính xác
      const signalIds = await this.saveSignals(
        cycleId,
        signals,
        normalizedData,
        normalizedDataMap,
      );
      this.logger.log(`Saved ${signalIds.length} signal records`);

      // Detect context/intelligence
      const context = this.intelligenceService.detectContext(signals);
      const intelligenceId = await this.saveIntelligence(
        cycleId,
        context,
        signalIds,
      );
      this.logger.log(`Saved intelligence record: ${intelligenceId}`);

      // Notify
      this.notificationService.notify(signals, context, normalizedData);
      await this.saveNotifications(intelligenceId);
      this.logger.log('Saved notification record');

      // Update cycle status thành "success"
      await this.prisma.cycles.update({
        where: { id: cycleId },
        data: {
          status: 'success',
          finished_at: new Date(),
        },
      });

      this.logger.log(`Cycle ${cycleId} completed successfully`);
    } catch (error) {
      this.logger.error(`Cycle failed: ${this.getErrorMessage(error)}`);

      if (cycleId) {
        await this.prisma.cycles.update({
          where: { id: cycleId },
          data: {
            status: 'failed',
            note: this.getErrorMessage(error),
            finished_at: new Date(),
          },
        });
      }

      throw error;
    }
  }

  private async saveRawData(
    cycleId: string,
    rawData: RawMarketData[],
  ): Promise<Map<string, string>> {
    const rawDataMap = new Map<string, string>();

    await Promise.all(
      rawData.map(async (data) => {
        const record = await this.prisma.raw_data.create({
          data: {
            cycle_id: cycleId,
            source: this.mapSourceToRawSource(data.source),
            data_type: 'market',
            asset_hint: data.asset,
            payload: data as unknown as Prisma.InputJsonValue,
            checksum: this.generateChecksum(data),
          },
        });

        // Tạo key để map: asset_source_unit
        const key = `${data.asset}_${data.source}_${data.unit || ''}`;
        rawDataMap.set(key, record.id);
        return record;
      }),
    );

    return rawDataMap;
  }

  private async saveNormalizedData(
    cycleId: string,
    normalizedData: NormalizedMarketData[],
    rawData: RawMarketData[],
    rawDataMap: Map<string, string>,
  ): Promise<Map<string, string>> {
    const normalizedDataMap = new Map<string, string>();

    await Promise.all(
      normalizedData.map(async (data, index) => {
        // Tìm raw data tương ứng dựa trên asset và source
        const rawDataItem = rawData[index];
        let rawId: string | undefined;

        if (rawDataItem) {
          const key = `${rawDataItem.asset}_${rawDataItem.source}_${rawDataItem.unit || ''}`;
          rawId = rawDataMap.get(key);
        }

        // Fallback: lấy raw_id đầu tiên nếu không tìm thấy
        if (!rawId && rawDataMap.size > 0) {
          rawId = Array.from(rawDataMap.values())[0];
        }

        if (!rawId) {
          throw new Error(
            `Cannot find raw_data for normalized data: ${data.asset}`,
          );
        }

        const assetCode = this.mapAssetToAssetCode(data.asset, data.coinType);
        const assetType = this.mapAssetToAssetType(data.asset);

        const record = await this.prisma.normalized_data.create({
          data: {
            cycle_id: cycleId,
            raw_id: rawId,
            asset_code: assetCode,
            asset_type: assetType,
            value: new Decimal(data.value),
            unit: this.getUnitForAsset(data.asset),
            effective_at: new Date(data.date),
            source: this.getSourceFromNormalized(data),
            normalize_version: '1.0',
          },
        });

        // Tạo key để map: asset_coinType hoặc asset
        const key =
          data.asset === 'CRYPTO' && data.coinType
            ? `${data.asset}_${data.coinType}`
            : data.asset;
        normalizedDataMap.set(key, record.id);

        return record;
      }),
    );

    return normalizedDataMap;
  }

  private async saveSignals(
    cycleId: string,
    signals: MarketSignal[],
    normalizedData: NormalizedMarketData[],
    normalizedDataMap: Map<string, string>,
  ): Promise<string[]> {
    const signalRecords = await Promise.all(
      signals.map(async (signal, index) => {
        // Tìm normalized data tương ứng dựa trên asset
        const normalizedDataItem = normalizedData[index];
        let normalizedId: string | undefined;

        if (normalizedDataItem) {
          const key =
            normalizedDataItem.asset === 'CRYPTO' &&
            normalizedDataItem.coinType
              ? `${normalizedDataItem.asset}_${normalizedDataItem.coinType}`
              : normalizedDataItem.asset;
          normalizedId = normalizedDataMap.get(key);
        }

        // Fallback: tìm theo asset nếu không match exact
        if (!normalizedId) {
          normalizedId = normalizedDataMap.get(signal.asset);
        }

        // Fallback: lấy normalized_id đầu tiên nếu không tìm thấy
        if (!normalizedId && normalizedDataMap.size > 0) {
          normalizedId = Array.from(normalizedDataMap.values())[0];
        }

        if (!normalizedId) {
          this.logger.warn(
            `Cannot find normalized_data for signal: ${signal.asset}, using empty based_on_ids`,
          );
        }

        const signalType = this.mapDirectionToSignalType(signal.direction);
        const assetCode = this.mapAssetToAssetCode(signal.asset);

        const record = await this.prisma.signals.create({
          data: {
            cycle_id: cycleId,
            signal_type: signalType,
            asset_code: assetCode,
            direction: signal.direction.toLowerCase(),
            strength: Math.round(signal.magnitude * 10),
            based_on_ids: normalizedId ? [normalizedId] : [],
          },
        });

        return record;
      }),
    );

    return signalRecords.map((r) => r.id);
  }

  private async saveIntelligence(
    cycleId: string,
    context: MarketContext,
    signalIds: string[],
  ): Promise<string> {
    const intelligence = await this.prisma.intelligence.create({
      data: {
        cycle_id: cycleId,
        context: context.context.toLowerCase(),
        confidence: new Decimal(context.confidence),
        horizon: this.mapSeverityToHorizon(context.severity),
        summary: `Market context: ${context.context}, severity: ${context.severity}, confidence: ${context.confidence}`,
        signal_refs: signalIds,
      },
    });

    return intelligence.id;
  }

  private async saveNotifications(intelligenceId: string): Promise<void> {
    await this.prisma.notifications.create({
      data: {
        intelligence_id: intelligenceId,
        channel: 'console',
        receiver: 'system',
        status: 'success',
        sent_at: new Date(),
      },
    });
  }

  private mapSourceToRawSource(source: string): string {
    if (source.includes('BTMC')) return 'btmc';
    if (source.includes('VIETCOMBANK')) return 'vietcombank';
    if (source.includes('COINGECKO')) return 'coingecko';
    if (source.includes('VNDIRECT')) return 'vndirect';
    return 'unknown';
  }

  private mapAssetToAssetCode(asset: string, coinType?: string): string {
    if (asset === 'USD') return 'USDVND';
    if (asset === 'GOLD') return 'XAUUSD';
    if (asset === 'CRYPTO' && coinType === 'BTC') return 'BTCUSD';
    if (asset === 'CRYPTO' && coinType === 'ETH') return 'ETHUSD';
    if (asset === 'STOCK') return 'VNINDEX';
    return asset;
  }

  private mapAssetToAssetType(asset: string): string {
    if (asset === 'USD') return 'fx';
    if (asset === 'GOLD') return 'gold';
    if (asset === 'CRYPTO') return 'crypto';
    if (asset === 'STOCK') return 'stock';
    return 'unknown';
  }

  private getUnitForAsset(asset: string): string {
    if (asset === 'USD' || asset === 'GOLD') return 'vnd';
    if (asset === 'CRYPTO') return 'usd';
    if (asset === 'STOCK') return 'point';
    return 'unknown';
  }

  private getSourceFromNormalized(data: NormalizedMarketData): string {
    if (data.asset === 'CRYPTO' && data.coinType) {
      return `coingecko_${data.coinType.toLowerCase()}`;
    }
    return 'normalized';
  }

  private mapDirectionToSignalType(direction: string): string {
    if (direction === 'UP') return 'price_up';
    if (direction === 'DOWN') return 'price_down';
    return 'price_flat';
  }

  private mapSeverityToHorizon(severity: string): string {
    if (severity === 'HIGH') return 'short';
    if (severity === 'MEDIUM') return 'mid';
    return 'long';
  }

  private generateChecksum(data: RawMarketData): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}
