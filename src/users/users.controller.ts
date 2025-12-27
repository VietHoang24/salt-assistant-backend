import { Controller, Get, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
    const { avatar_url, full_name, email, id } = userProfile;
    return { avatar_url, full_name, email, id };
  }
}
