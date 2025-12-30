import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { GoalsService } from '../../goals/goals.service';
import { DailyQuoteResponse } from '../../modules/daily-quote/dto/daily-quote.response';

export interface CycleData {
  id: string;
  normalized: Array<{
    asset_code: string;
    asset_type: string;
    value: any;
    unit: string | null;
    effective_at: Date;
  }>;
  signals: Array<{
    signal_type: string;
    asset_code: string | null;
    direction: string | null;
    strength: number | null;
  }>;
  intelligence: Array<{
    context: string;
    confidence: any;
    summary: string;
  }>;
}

@Injectable()
export class MarketMessageFormatterService {
  constructor(private readonly goalsService: GoalsService) {}

  async formatMarketMessage(
    cycle: CycleData,
    userId: string,
    dailyQuote?: DailyQuoteResponse | null,
  ): Promise<string> {
    const messageLines: string[] = [];
    messageLines.push('*🌅 Cập nhật thị trường buổi sáng* 📊');
    messageLines.push('');

    this.addMarketPricesSection(messageLines, cycle.normalized);
    this.addSignalsSection(messageLines, cycle.signals);
    this.addIntelligenceSection(messageLines, cycle.intelligence);
    await this.addWeeklyGoalsSection(messageLines, userId);
    this.addDailyQuoteSection(messageLines, dailyQuote);
    console.log('dailyQuote', dailyQuote)
    return messageLines.join('\n');
  }

  private addMarketPricesSection(
    messageLines: string[],
    normalized: CycleData['normalized'],
  ): void {
    if (normalized.length === 0) return;

    messageLines.push('*Giá thị trường:*');
    for (const data of normalized) {
      const formattedValue = this.formatMarketValue(
        data.value,
        data.asset_code,
        data.unit,
      );
      messageLines.push(
        `• ${this.getAssetLabel(data.asset_code)}: ${formattedValue}`,
      );
    }
    messageLines.push('');
  }

  private addSignalsSection(
    messageLines: string[],
    signals: CycleData['signals'],
  ): void {
    if (signals.length === 0) return;

    messageLines.push('*Tín hiệu thị trường:*');
    for (const signal of signals) {
      const direction = signal.direction
        ? this.formatDirection(signal.direction)
        : '';
      const strength = signal.strength ? ` (${signal.strength})` : '';
      messageLines.push(
        `• ${this.getAssetLabel(signal.asset_code || 'N/A')}: ${direction}${strength}`,
      );
    }
    messageLines.push('');
  }

  private addIntelligenceSection(
    messageLines: string[],
    intelligence: CycleData['intelligence'],
  ): void {
    if (intelligence.length === 0) return;

    const intel = intelligence[0];
    messageLines.push('*Phân tích thị trường:*');
    messageLines.push(`Context: ${intel.context}`);
    messageLines.push(`Summary: ${intel.summary}`);
    messageLines.push('');
  }

  private async addWeeklyGoalsSection(
    messageLines: string[],
    userId: string,
  ): Promise<void> {
    try {
      const today = dayjs();
      const weeklyGoals = await this.goalsService.getGoalsForYearMonth(
        userId,
        today.year(),
        today.month() + 1,
      );

      if (weeklyGoals.weekly_goals && weeklyGoals.weekly_goals.length > 0) {
        messageLines.push('*📌 Mục tiêu tuần của bạn:*');
        for (const goal of weeklyGoals.weekly_goals) {
          const progressText =
            goal.start_date && goal.end_date
              ? `${dayjs(goal.start_date).format('DD/MM')} - ${dayjs(goal.end_date).format('DD/MM')}`
              : '';
          messageLines.push(
            `• ${goal.title}${progressText ? ` (${progressText})` : ''}`,
          );
          if (goal.description) {
            messageLines.push(`  ${goal.description}`);
          }
        }
        messageLines.push('');
      }
    } catch {
      // Silently fail - goals are optional
    }
  }

  formatMarketValue(value: any, assetCode: string, unit: string | null): string {
    const numValue =
      typeof value === 'object' && value !== null && 'toNumber' in value
        ? (value as { toNumber: () => number }).toNumber()
        : Number(value);

    if (assetCode.includes('USD') || assetCode.includes('VND')) {
      return `${numValue.toLocaleString('vi-VN')} ${unit || 'VND'}`;
    }
    if (assetCode.includes('BTC') || assetCode.includes('ETH')) {
      return `$${numValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return `${numValue.toLocaleString('vi-VN')} ${unit || ''}`;
  }

  getAssetLabel(assetCode: string | null): string {
    if (!assetCode) return 'N/A';
    if (assetCode === 'USDVND') return 'USD/VND';
    if (assetCode === 'XAUUSD_BUY') return 'Vàng SJC (Mua)';
    if (assetCode === 'XAUUSD_SELL') return 'Vàng SJC (Bán)';
    // Legacy support
    if (assetCode.includes('XAUUSD')) return 'Vàng SJC';
    if (assetCode.includes('BTC')) return 'Bitcoin';
    if (assetCode.includes('ETH')) return 'Ethereum';
    return assetCode;
  }

  formatDirection(direction: string): string {
    const dir = direction.toLowerCase();
    if (dir === 'up') return '⬆️ Tăng';
    if (dir === 'down') return '⬇️ Giảm';
    return '➡️ Ổn định';
  }

  private addDailyQuoteSection(
    messageLines: string[],
    dailyQuote?: DailyQuoteResponse | null,
  ): void {
    if (!dailyQuote || !dailyQuote.content) return;

    messageLines.push('*💭 Câu nói truyền cảm hứng hôm nay:*');
    messageLines.push(`"${dailyQuote.content}"`);
    if (dailyQuote.author) {
      messageLines.push(`— ${dailyQuote.author}`);
    }
    messageLines.push('');
  }
}

