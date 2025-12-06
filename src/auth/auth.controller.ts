import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @Public()
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @Public()
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    if (!req.user) {
      throw new Error('User not found');
    }

    const data = await this.authService.validateGoogleUser(req.user as any);

    // FE URL nhận token (lấy từ env, fallback về localhost)
    const frontend = (
      process.env.FRONTEND_URL || 'http://localhost:3001'
    ).replace(/\/+$/, '');
    const redirectUrl = `${frontend}/login-success?access=${encodeURIComponent(
      data.access_token,
    )}&refresh=${encodeURIComponent(data.refresh_token)}`;

    // Redirect FE
    return res.redirect(redirectUrl);
  }
}
