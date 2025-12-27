import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PrismaService } from '@/prisma/prisma.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getUsers() {
    return this.usersService.findAll();
  }

  @Get('me')
  async me(@CurrentUser() user: { sub: string; email: string | null }) {
    const userProfile = await this.usersService.findOne(user.sub);
    if (!userProfile) {
      throw new NotFoundException('User not found');
    }
    const { avatar_url, full_name, email, id, telegram_chat_id } = userProfile;
    return { avatar_url, full_name, email, id, telegram_chat_id };
  }

  @Patch('telegram/disconnect')
  async disconnectTelegram(
    @CurrentUser() user: { sub: string; email: string | null },
  ) {
    const userProfile = await this.usersService.findOne(user.sub);
    if (!userProfile) {
      throw new NotFoundException('User not found');
    }
    const { id, telegram_chat_id } = userProfile;
    if (!telegram_chat_id) {
      throw new BadRequestException('Telegram is not connected');
    }
    await this.usersService.update(id, { telegram_chat_id: null });
    return { message: 'Telegram disconnected successfully' };
  }
}
