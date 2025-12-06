// src/goals/goals.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import dayjs from 'dayjs';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  private getWeekOfMonth(date: dayjs.Dayjs) {
    return Math.ceil(date.date() / 7);
  }

  private validateGoalDates(dto: {
    type: string;
    start_date: string;
    end_date: string;
  }) {
    const start = dayjs(dto.start_date);
    const end = dayjs(dto.end_date);

    if (!start.isValid() || !end.isValid()) {
      throw new BadRequestException('Invalid date format');
    }

    if (start.isAfter(end)) {
      throw new BadRequestException('start_date cannot be after end_date');
    }

    const sameYear = start.year() === end.year();
    const sameMonth = start.month() === end.month();

    if (dto.type === 'yearly') {
      if (!sameYear) {
        throw new BadRequestException(
          'Yearly goal must be within the same year',
        );
      }
    }

    if (dto.type === 'monthly') {
      if (!sameYear || !sameMonth) {
        throw new BadRequestException(
          'Monthly goal must be within the same month & year',
        );
      }
    }

    if (dto.type === 'weekly') {
      if (!sameYear || !sameMonth) {
        throw new BadRequestException(
          'Weekly goal must be within the same month & year',
        );
      }
      const startWeek = this.getWeekOfMonth(start);
      const endWeek = this.getWeekOfMonth(end);
      if (startWeek !== endWeek) {
        throw new BadRequestException(
          'Weekly goal must be within the same week',
        );
      }
    }
  }

  // 🟢 CREATE goal
  async create(userId: string, dto: CreateGoalDto) {
    this.validateGoalDates(dto);

    return this.prisma.user_goals.create({
      data: {
        user_id: userId,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        start_date: new Date(dto.start_date),
        end_date: new Date(dto.end_date),
        // timestamps required by the Prisma type (no defaults in schema)
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  // 🟠 UPDATE goal
  async update(userId: string, id: string, dto: UpdateGoalDto) {
    const existing = await this.prisma.user_goals.findFirst({
      where: { id, user_id: userId },
    });
    if (!existing) {
      throw new NotFoundException('Goal not found');
    }

    const merged = {
      type: dto.type ?? existing.type,
      start_date: dto.start_date ?? existing.start_date.toISOString(),
      end_date: dto.end_date ?? existing.end_date.toISOString(),
    };

    this.validateGoalDates(merged as any);

    return this.prisma.user_goals.update({
      where: { id },
      data: {
        title: dto.title ?? existing.title,
        description: dto.description ?? existing.description,
        type: dto.type ?? existing.type,
        start_date: dto.start_date
          ? new Date(dto.start_date)
          : existing.start_date,
        end_date: dto.end_date ? new Date(dto.end_date) : existing.end_date,
      },
    });
  }

  // 🔴 DELETE goal
  async remove(userId: string, id: string) {
    const existing = await this.prisma.user_goals.findFirst({
      where: { id, user_id: userId },
    });
    if (!existing) {
      throw new NotFoundException('Goal not found');
    }

    await this.prisma.user_goals.delete({ where: { id } });
    return { message: 'Goal deleted successfully' };
  }

  // 🔵 LIST goals cho UI: yearly + monthly + weekly
  async getGoalsForYearMonth(userId: string, year: number, month: number) {
    // Boundaries for that month
    const startOfYear = dayjs(`${year}-01-01`).startOf('day');
    const endOfYear = startOfYear.add(1, 'year');

    const startOfMonth = dayjs()
      .year(year)
      .month(month - 1)
      .date(1)
      .startOf('day');
    const endOfMonth = startOfMonth.add(1, 'month');

    const [yearlyGoals, monthlyGoals, weeklyGoals] = await Promise.all([
      this.prisma.user_goals.findMany({
        where: {
          user_id: userId,
          type: 'yearly',
          start_date: {
            gte: startOfYear.toDate(),
            lt: endOfYear.toDate(),
          },
        },
        orderBy: { created_at: 'asc' },
      }),
      this.prisma.user_goals.findMany({
        where: {
          user_id: userId,
          type: 'monthly',
          start_date: {
            gte: startOfMonth.toDate(),
            lt: endOfMonth.toDate(),
          },
        },
        orderBy: { created_at: 'asc' },
      }),
      this.prisma.user_goals.findMany({
        where: {
          user_id: userId,
          type: 'weekly',
          start_date: {
            gte: startOfMonth.toDate(),
            lt: endOfMonth.toDate(),
          },
        },
        orderBy: { start_date: 'asc' },
      }),
    ]);

    return {
      yearly_goals: yearlyGoals[0], // get one
      monthly_goals: monthlyGoals[0], // hoặc chỉ lấy 1
      weekly_goals: weeklyGoals,
    };
  }
}
