// Dashboard controller
import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardResponse } from './dto/dashboard.response';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboard(
    @CurrentUser() user: { sub: string },
  ): Promise<DashboardResponse> {
    return this.dashboardService.getDashboardData(user.sub);
  }
}

