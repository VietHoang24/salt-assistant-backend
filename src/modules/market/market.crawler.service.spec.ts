import { Test, TestingModule } from '@nestjs/testing';
import { MarketCrawlerService } from './market.crawler.service';

describe('MarketCrawlerService', () => {
  let service: MarketCrawlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MarketCrawlerService],
    }).compile();

    service = module.get<MarketCrawlerService>(MarketCrawlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
