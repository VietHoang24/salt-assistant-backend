// Repository for daily quote data access
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class DailyQuoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find user-specific quote by date
   */
  async findByUserAndDate(userId: string, date: Date) {
    try {
      return await this.prisma.user_daily_quotes.findUnique({
        where: {
          user_id_date: {
            user_id: userId,
            date,
          },
        },
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * Create a new user-specific daily quote
   */
  async create(
    userId: string,
    data: {
      content: string;
      author?: string;
      date: Date;
    },
  ) {
    return await this.prisma.user_daily_quotes.create({
      data: {
        user_id: userId,
        content: data.content,
        author: data.author,
        date: data.date,
      },
    });
  }

  /**
   * Get today's quote for a specific user
   */
  async getTodayQuoteForUser(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.findByUserAndDate(userId, today);
  }
}

