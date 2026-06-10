import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeviceTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async register(userId: string, token: string, platform?: string) {
    const device = await this.prisma.deviceToken.upsert({
      where: { token },
      update: {
        userId,
        platform,
      },
      create: {
        userId,
        token,
        platform,
      },
    });

    return {
      message: 'Device token registered',
      device: {
        id: device.id,
        platform: device.platform,
        createdAt: device.createdAt,
        updatedAt: device.updatedAt,
      },
    };
  }

  async remove(userId: string, token: string) {
    await this.prisma.deviceToken.deleteMany({
      where: { userId, token },
    });

    return { message: 'Device token removed' };
  }

  async getTokensForUser(userId: string): Promise<string[]> {
    const devices = await this.prisma.deviceToken.findMany({
      where: { userId },
      select: { token: true },
    });

    return devices.map((device) => device.token);
  }

  async removeInvalidTokens(tokens: string[]): Promise<void> {
    if (tokens.length === 0) {
      return;
    }

    await this.prisma.deviceToken.deleteMany({
      where: { token: { in: tokens } },
    });
  }
}
