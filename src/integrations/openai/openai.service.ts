// OpenAI service - business logic layer
import { Injectable, Logger } from '@nestjs/common';
import { OpenAIClient } from './openai.client';
import { PROMPTS } from './openai.prompts';
import { ChatMessage } from './openai.types';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);

  constructor(private readonly client: OpenAIClient) {}

  /**
   * Generate a daily inspirational quote
   */
  async generateDailyQuote(context?: string): Promise<{
    content: string;
    author?: string;
  }> {
    try {
      const systemPrompt = PROMPTS.dailyQuote.system;
      const userPrompt = PROMPTS.dailyQuote.user(context);

      const response = await this.client.generateText(
        userPrompt,
        systemPrompt,
        {
          temperature: 0.8,
          maxTokens: 200,
        },
      );

      // Parse response to extract quote and author
      // Format: "Quote text" - Author Name
      const quoteMatch = response.match(/^["']?(.+?)["']?\s*-?\s*(.+)?$/);
      if (quoteMatch) {
        return {
          content: quoteMatch[1].trim(),
          author: quoteMatch[2]?.trim(),
        };
      }

      // Fallback: return the whole response as content
      return {
        content: response.trim(),
      };
    } catch (error) {
      this.logger.error('Failed to generate daily quote', error);
      throw error;
    }
  }

  /**
   * Generic method to generate text using a prompt template
   */
  async generateWithPrompt(
    promptKey: keyof typeof PROMPTS,
    context?: string,
  ): Promise<string> {
    const prompt = PROMPTS[promptKey];
    const systemPrompt = prompt.system;
    const userPrompt =
      typeof prompt.user === 'function' ? prompt.user(context) : prompt.user;

    return this.client.generateText(userPrompt, systemPrompt);
  }
}

