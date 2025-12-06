// src/goals/goals.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  // Using authenticated user from request (JWT)
  // Request user shape: { sub: string, ... }

  @Post()
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateGoalDto) {
    return this.goalsService.create(user.sub, dto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.goalsService.update(user.sub, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    console.log('id', id);
    return this.goalsService.remove(user.sub, id);
  }

  // GET /goals/list?year=2025&month=11
  @Get('list')
  getGoalsForUi(
    @CurrentUser() user: { sub: string },
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    return this.goalsService.getGoalsForYearMonth(user.sub, y, m);
  }
}
