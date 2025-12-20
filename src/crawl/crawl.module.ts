import { Module } from '@nestjs/common';
import { CrawlService } from './crawl.service';

@Module({
  providers: [CrawlService]
})
export class CrawlModule {}
