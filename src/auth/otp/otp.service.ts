import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpPurpose } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async sendOtp(target: string, purpose: OtpPurpose): Promise<{ message: string }> {
    await this.issueOtp(target, purpose);
    return { message: 'OTP sent successfully' };
  }

  async sendOtpAndGetCode(
    target: string,
    purpose: OtpPurpose,
  ): Promise<{ message: string; code: string }> {
    const code = await this.issueOtp(target, purpose);
    return { message: 'OTP sent successfully', code };
  }

  async verifyOtp(
    target: string,
    code: string,
    purpose: OtpPurpose,
  ): Promise<void> {
    const normalizedTarget = this.normalizeTarget(target, purpose);

    const otp = await this.prisma.otp.findFirst({
      where: {
        target: normalizedTarget,
        purpose,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp || otp.code !== code) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.prisma.otp.update({
      where: { id: otp.id },
      data: { usedAt: new Date() },
    });
  }

  private async issueOtp(target: string, purpose: OtpPurpose): Promise<string> {
    const normalizedTarget = this.normalizeTarget(target, purpose);
    await this.invalidateActiveOtps(normalizedTarget, purpose);

    const code = this.generateCode();
    const expiryMinutes = this.configService.get<number>('OTP_EXPIRY_MINUTES', 5);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await this.prisma.otp.create({
      data: {
        target: normalizedTarget,
        code,
        purpose,
        expiresAt,
      },
    });

    this.logger.log(`OTP for ${normalizedTarget} (${purpose}): ${code}`);
    return code;
  }

  private async invalidateActiveOtps(
    target: string,
    purpose: OtpPurpose,
  ): Promise<void> {
    await this.prisma.otp.updateMany({
      where: {
        target,
        purpose,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });
  }

  private normalizeTarget(target: string, purpose: OtpPurpose): string {
    if (
      purpose === OtpPurpose.PHONE_AUTH ||
      (purpose !== OtpPurpose.EMAIL_VERIFICATION && target.includes('+'))
    ) {
      return target.replace(/\s/g, '');
    }
    return target.toLowerCase().trim();
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
