import { Test, TestingModule } from '@nestjs/testing';
import { NormalizeService } from './normalize.service';

describe('NormalizeService', () => {
  let service: NormalizeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NormalizeService],
    }).compile();

    service = module.get<NormalizeService>(NormalizeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
