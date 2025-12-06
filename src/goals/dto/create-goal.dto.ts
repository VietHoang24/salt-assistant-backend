// src/goals/dto/create-goal.dto.ts

import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateGoalDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(['yearly', 'monthly', 'weekly'], {
    message: 'type must be yearly, monthly, or weekly',
  })
  type: 'yearly' | 'monthly' | 'weekly';

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;
}
