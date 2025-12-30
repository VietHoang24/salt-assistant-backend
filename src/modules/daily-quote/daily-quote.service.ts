// Daily quote service - business logic
import { Injectable, Logger } from '@nestjs/common';
import { DailyQuoteRepository } from './daily-quote.repository';
import { OpenAIService } from '@/integrations/openai/openai.service';
import { DailyQuoteResponse } from './dto/daily-quote.response';

@Injectable()
export class DailyQuoteService {
  private readonly logger = new Logger(DailyQuoteService.name);

  constructor(
    private readonly repository: DailyQuoteRepository,
    private readonly openaiService: OpenAIService,
  ) {}

  /**
   * Get today's quote, generate if not exists
   */
  async getTodayQuote(): Promise<DailyQuoteResponse> {
    try {
      // Try to get existing quote for today
      const existing = await this.repository.getTodayQuote();

      if (existing) {
        return this.mapToResponse(existing);
      }

      // Generate new quote if not exists
      this.logger.log('Generating new daily quote...');
      const generated = await this.openaiService.generateDailyQuote();

      // Save to database
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const saved = await this.repository.create({
        content: generated.content,
        author: generated.author,
        date: today,
      });

      return this.mapToResponse(saved);
    } catch (error) {
      this.logger.error('Failed to get today quote', error);
      throw error;
    }
  }

  /**
   * Generate and save a new quote for today
   */
  async generateNewQuote(context?: string): Promise<DailyQuoteResponse> {
    try {
      const generated = await this.openaiService.generateDailyQuote(context);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const saved = await this.repository.create({
        content: generated.content,
        author: generated.author,
        date: today,
      });

      return this.mapToResponse(saved);
    } catch (error) {
      this.logger.error('Failed to generate new quote', error);
      throw error;
    }
  }

  /**
   * Map database entity to response DTO
   */
  private mapToResponse(entity: any): DailyQuoteResponse {
    return {
      id: entity.id,
      content: entity.content,
      author: entity.author,
      date: entity.date instanceof Date ? entity.date.toISOString() : entity.date,
      createdAt: entity.createdAt
        ? entity.createdAt instanceof Date
          ? entity.createdAt.toISOString()
          : entity.createdAt
        : undefined,
    };
  }
}

