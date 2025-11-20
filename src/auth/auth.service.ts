import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';

interface GoogleUser {
  google_id: string;
  email: string;
  full_name: string;
  avatar_url: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateGoogleUser(googleUser: GoogleUser) {
    let user = await this.prisma.users.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      user = await this.prisma.users.create({
        data: {
          email: googleUser.email,
          google_id: googleUser.google_id,
          full_name: googleUser.full_name,
          avatar_url: googleUser.avatar_url,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }

    return {
      ...this.generateTokens(user),
      user,
    };
  }

  generateTokens(user: { id: string; email: string | null }) {
    const payload = { sub: user.id, email: user.email };

    const access_token = this.jwtService.sign(payload, { expiresIn: '3h' });
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '30d' });

    return { access_token, refresh_token };
  }
}
