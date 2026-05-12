import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GoogleAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async saveAdminTokens(email: string, tokens: any) {
    const emailLower = email.toLowerCase();
    return this.prisma.googleAuth.upsert({
      where: { email: emailLower },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
        scope: tokens.scope,
        tokenType: tokens.token_type,
        isActive: true,
      },
      create: {
        email: emailLower,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
        scope: tokens.scope,
        tokenType: tokens.token_type,
        isActive: true,
      },
    });
  }

  async getAdminTokens() {
    const auth = await this.prisma.googleAuth.findFirst({
      where: { isActive: true },
    });
    if (!auth) throw new Error('Системный Google токен не найден');

    return {
      access_token: auth.accessToken,
      refresh_token: auth.refreshToken,
      expiry_date: auth.expiryDate ? Number(auth.expiryDate) : undefined,
      scope: auth.scope,
      token_type: auth.tokenType,
    };
  }
}
