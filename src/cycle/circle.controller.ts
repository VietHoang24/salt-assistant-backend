import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { CycleService } from './cycle.service';
import { Public } from '@/auth/public.decorator';

@Controller('cycle')
export class CycleController {
  constructor(private readonly cycleService: CycleService) {}

  @Get('run')
  @Public()
  async runCycle(): Promise<{ status: string; message: string }> {
    try {
      await this.cycleService.runCycle();
      return { status: 'success', message: 'Cycle executed' };
    } catch (error) {
      console.error('Cycle execution failed', error);
      throw new InternalServerErrorException('Cycle execution failed');
    }
  }
}
