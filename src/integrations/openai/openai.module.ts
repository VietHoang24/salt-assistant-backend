import { Module } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { OpenAIClient } from './openai.client';

@Module({
  providers: [OpenAIClient, OpenAIService],
  exports: [OpenAIService, OpenAIClient],
})
export class OpenAIModule {}

