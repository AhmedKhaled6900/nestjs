import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthProvider, OtpPurpose, RoleName } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyResetOtpDto,
} from '../dto/auth.dto';
import { VerifyPhoneOtpDto } from '../dto/phone-auth.dto';
import { AuthResponse } from '../interfaces/auth.interface';
import { OtpService } from '../otp/otp.service';
import { PasswordService } from '../services/password.service';
import { TokenService } from '../services/token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly otpService: OtpService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const roleName = dto.role ?? RoleName.CUSTOMER;
    if (roleName === RoleName.ADMIN) {
      throw new BadRequestException('Cannot self-register as admin');
    }

    const role = await this.prisma.role.findUniqueOrThrow({
      where: { name: roleName },
    });

    const hashedPassword = await this.passwordService.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        provider: AuthProvider.LOCAL,
        roleId: role.id,
        isVerified: true,
      },
      include: { role: true },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { role: true },
    });

    if (!user?.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.passwordService.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(user);
  }

  async sendPhoneOtp(phone: string): Promise<{ message: string }> {
    return this.otpService.sendOtp(phone, OtpPurpose.PHONE_AUTH);
  }

  async verifyPhoneOtp(dto: VerifyPhoneOtpDto): Promise<AuthResponse> {
    await this.otpService.verifyOtp(dto.phone, dto.code, OtpPurpose.PHONE_AUTH);

    let user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
      include: { role: true },
    });

    if (!user) {
      const role = await this.prisma.role.findUniqueOrThrow({
        where: { name: RoleName.CUSTOMER },
      });

      user = await this.prisma.user.create({
        data: {
          name: dto.name,
          phone: dto.phone,
          provider: AuthProvider.PHONE,
          roleId: role.id,
          isVerified: true,
        },
        include: { role: true },
      });
    }

    return this.buildAuthResponse(user);
  }

  async handleGoogleLogin(profile: {
    providerId: string;
    email: string;
    name: string;
  }): Promise<AuthResponse> {
    let user = await this.prisma.user.findFirst({
      where: {
        provider: AuthProvider.GOOGLE,
        providerId: profile.providerId,
      },
      include: { role: true },
    });

    if (!user && profile.email) {
      user = await this.prisma.user.findUnique({
        where: { email: profile.email.toLowerCase() },
        include: { role: true },
      });

      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            provider: AuthProvider.GOOGLE,
            providerId: profile.providerId,
            isVerified: true,
          },
          include: { role: true },
        });
      }
    }

    if (!user) {
      const role = await this.prisma.role.findUniqueOrThrow({
        where: { name: RoleName.CUSTOMER },
      });

      user = await this.prisma.user.create({
        data: {
          name: profile.name,
          email: profile.email.toLowerCase(),
          provider: AuthProvider.GOOGLE,
          providerId: profile.providerId,
          roleId: role.id,
          isVerified: true,
        },
        include: { role: true },
      });
    }

    return this.buildAuthResponse(user);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const target = this.resolveTarget(dto.email, dto.phone);
    const user = await this.findUserByTarget(dto.email, dto.phone);

    if (!user) {
      return { message: 'If the account exists, an OTP has been sent' };
    }

    return this.otpService.sendOtp(target, OtpPurpose.PASSWORD_RESET);
  }

  async verifyResetOtp(dto: VerifyResetOtpDto): Promise<{ message: string }> {
    const target = this.resolveTarget(dto.email, dto.phone);
    await this.findUserByTargetOrFail(dto.email, dto.phone);
    await this.otpService.verifyOtp(target, dto.code, OtpPurpose.PASSWORD_RESET);
    return { message: 'OTP verified successfully' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const target = this.resolveTarget(dto.email, dto.phone);
    const user = await this.findUserByTargetOrFail(dto.email, dto.phone);

    await this.otpService.verifyOtp(target, dto.code, OtpPurpose.PASSWORD_RESET);

    const hashedPassword = await this.passwordService.hash(dto.newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await this.tokenService.invalidateRefreshToken(user.id);

    return { message: 'Password reset successfully' };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const tokens = await this.tokenService.refreshAccessToken(refreshToken);
    const payload = await this.decodeAccessToken(tokens.accessToken);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: payload.sub },
      include: { role: true },
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role.name,
      },
    };
  }

  private async buildAuthResponse(user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: { name: string };
  }): Promise<AuthResponse> {
    const tokens = await this.tokenService.generateTokens({
      sub: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role.name,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role.name,
      },
    };
  }

  private resolveTarget(email?: string, phone?: string): string {
    if (email) return email.toLowerCase().trim();
    if (phone) return phone.replace(/\s/g, '');
    throw new BadRequestException('Email or phone is required');
  }

  private async findUserByTarget(email?: string, phone?: string) {
    if (email) {
      return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    }
    if (phone) {
      return this.prisma.user.findUnique({ where: { phone } });
    }
    throw new BadRequestException('Email or phone is required');
  }

  private async findUserByTargetOrFail(email?: string, phone?: string) {
    const user = await this.findUserByTarget(email, phone);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  private async decodeAccessToken(token: string): Promise<{ sub: string }> {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Invalid token');
    }
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8'),
    ) as { sub: string };
    return payload;
  }
}
