import { Module } from '@nestjs/common';
import { IntelligenceService } from './intelligence.service';

@Module({
  providers: [IntelligenceService]
})
export class IntelligenceModule {}
