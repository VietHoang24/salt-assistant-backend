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
   * Get today's quote for a specific user, generate if not exists
   */
  async getTodayQuoteForUser(userId: string): Promise<DailyQuoteResponse> {
    try {
      // Try to get existing user-specific quote for today
      const existing = await this.repository.getTodayQuoteForUser(userId);

      if (existing) {
        return this.mapToResponse(existing);
      }

      // Generate new quote if not exists
      this.logger.log(`Generating new daily quote for user ${userId}...`);
      const generated = await this.openaiService.generateDailyQuote();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Use upsert to handle race conditions (repository now uses upsert)
      const saved = await this.repository.create(userId, {
        content: generated.content,
        author: generated.author,
        date: today,
      });

      return this.mapToResponse(saved);
    } catch (error) {
      this.logger.error(`Failed to get today quote for user ${userId}`, error);
      
      // If error is due to unique constraint, try to fetch existing quote
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        this.logger.warn(`Quote already exists for user ${userId}, fetching existing...`);
        const existing = await this.repository.getTodayQuoteForUser(userId);
        if (existing) {
          return this.mapToResponse(existing);
        }
      }
      
      throw error;
    }
  }

  /**
   * Generate and save a new quote for a specific user
   * This will update existing quote if one exists for today
   */
  async generateNewQuote(
    userId: string,
    context?: string,
  ): Promise<DailyQuoteResponse> {
    try {
      const generated = await this.openaiService.generateDailyQuote(context);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Use upsert to update if exists, create if not
      const saved = await this.repository.create(userId, {
        content: generated.content,
        author: generated.author,
        date: today,
      });

      return this.mapToResponse(saved);
    } catch (error) {
      this.logger.error(`Failed to generate new quote for user ${userId}`, error);
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
      createdAt: entity.created_at
        ? entity.created_at instanceof Date
          ? entity.created_at.toISOString()
          : entity.created_at
        : undefined,
    };
  }
}

