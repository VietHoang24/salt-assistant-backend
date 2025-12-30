// OpenAI SDK wrapper/client
import { Injectable, Logger } from '@nestjs/common';
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatMessage,
  OpenAIError,
} from './openai.types';

@Injectable()
export class OpenAIClient {
  private readonly logger = new Logger(OpenAIClient.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openai.com/v1';
  private readonly defaultModel = 'gpt-3.5-turbo';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      this.logger.warn('OPENAI_API_KEY not found in environment variables');
    }
  }

  async createChatCompletion(
    messages: ChatMessage[],
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    },
  ): Promise<ChatCompletionResponse> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const request: ChatCompletionRequest = {
      model: options?.model || this.defaultModel,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 500,
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error: OpenAIError = await response.json();
        throw new Error(
          `OpenAI API error: ${error.error?.message || response.statusText}`,
        );
      }

      const data: ChatCompletionResponse = await response.json();
      return data;
    } catch (error) {
      this.logger.error('OpenAI API request failed', error);
      throw error;
    }
  }

  async generateText(
    prompt: string,
    systemPrompt?: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    },
  ): Promise<string> {
    const messages: ChatMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await this.createChatCompletion(messages, options);
    return response.choices[0]?.message?.content || '';
  }
}

