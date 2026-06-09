import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthProvider, OtpPurpose, ProfileStatus, RoleName } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResendVerificationDto,
  ResetPasswordDto,
  VerifyEmailDto,
  VerifyResetOtpDto,
} from '../dto/auth.dto';
import { VerifyPhoneOtpDto } from '../dto/phone-auth.dto';
import { EmailService } from '../email/email.service';
import {
  AuthResponse,
  RegisterPendingResponse,
} from '../interfaces/auth.interface';
import { OtpService } from '../otp/otp.service';
import { PasswordService } from '../services/password.service';
import { TokenService } from '../services/token.service';

type UserWithRole = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  isVerified: boolean;
  role: { name: string };
  ownerProfile?: {
    profileStatus: ProfileStatus;
    ownerType: string | null;
  } | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto): Promise<RegisterPendingResponse> {
    if (dto.role === RoleName.ADMIN) {
      throw new BadRequestException('Cannot self-register as admin');
    }

    const email = dto.email.toLowerCase();
    const phone = dto.phone.replace(/\s/g, '');

    const [existingEmail, existingPhone] = await Promise.all([
      this.prisma.user.findUnique({ where: { email } }),
      this.prisma.user.findUnique({ where: { phone } }),
    ]);

    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }
    if (existingPhone) {
      throw new ConflictException('Phone already registered');
    }

    const role = await this.prisma.role.findUniqueOrThrow({
      where: { name: dto.role },
    });

    const hashedPassword = await this.passwordService.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email,
        phone,
        password: hashedPassword,
        provider: AuthProvider.LOCAL,
        roleId: role.id,
        isVerified: false,
        ...(dto.role === RoleName.OWNER
          ? {
              ownerProfile: {
                create: {
                  profileStatus: ProfileStatus.INCOMPLETE,
                },
              },
            }
          : {}),
      },
      include: { role: true, ownerProfile: true },
    });

    await this.sendVerificationEmail(user.email!, user.name);

    return {
      message: 'Registration successful. Please verify your email.',
      user: this.mapUserResponse(user),
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { role: true, ownerProfile: true },
    });

    if (!user?.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.passwordService.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      await this.sendVerificationEmail(user.email!, user.name);
      throw new ForbiddenException({
        message: 'Email not verified. A new verification code has been sent to your email.',
        isVerified: false,
      });
    }

    return this.buildAuthResponse(user);
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<AuthResponse> {
    const email = dto.email.toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true, ownerProfile: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isVerified) {
      return this.buildAuthResponse(user);
    }

    await this.otpService.verifyOtp(email, dto.code, OtpPurpose.EMAIL_VERIFICATION);

    const verifiedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
      include: { role: true, ownerProfile: true },
    });

    return this.buildAuthResponse(verifiedUser);
  }

  async resendVerification(dto: ResendVerificationDto): Promise<{ message: string }> {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      return { message: 'If the account exists, a verification email has been sent' };
    }

    if (user.isVerified) {
      throw new BadRequestException('Email is already verified');
    }

    await this.sendVerificationEmail(email, user.name);

    return { message: 'Verification email sent successfully' };
  }

  async sendPhoneOtp(phone: string): Promise<{ message: string }> {
    return this.otpService.sendOtp(phone, OtpPurpose.PHONE_AUTH);
  }

  async verifyPhoneOtp(dto: VerifyPhoneOtpDto): Promise<AuthResponse> {
    await this.otpService.verifyOtp(dto.phone, dto.code, OtpPurpose.PHONE_AUTH);

    let user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
      include: { role: true, ownerProfile: true },
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
        include: { role: true, ownerProfile: true },
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
      include: { role: true, ownerProfile: true },
    });

    if (!user && profile.email) {
      user = await this.prisma.user.findUnique({
        where: { email: profile.email.toLowerCase() },
        include: { role: true, ownerProfile: true },
      });

      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            provider: AuthProvider.GOOGLE,
            providerId: profile.providerId,
            isVerified: true,
          },
          include: { role: true, ownerProfile: true },
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
        include: { role: true, ownerProfile: true },
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
      include: { role: true, ownerProfile: true },
    });

    if (!user.isVerified) {
      throw new ForbiddenException({
        message: 'Email not verified',
        isVerified: false,
      });
    }

    return {
      ...tokens,
      user: this.mapUserResponse(user),
    };
  }

  private async sendVerificationEmail(email: string, name: string): Promise<void> {
    const { code } = await this.otpService.sendOtpAndGetCode(
      email,
      OtpPurpose.EMAIL_VERIFICATION,
    );
    await this.emailService.sendVerificationEmail(email, name, code);
  }

  private async buildAuthResponse(user: UserWithRole): Promise<AuthResponse> {
    const tokens = await this.tokenService.generateTokens({
      sub: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role.name,
    });

    return {
      ...tokens,
      user: this.mapUserResponse(user),
    };
  }

  private mapUserResponse(user: UserWithRole) {
    const isOwner = user.role.name === RoleName.OWNER;
    const profileStatus = user.ownerProfile?.profileStatus ?? null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role.name,
      isVerified: user.isVerified,
      ...(isOwner
        ? {
            isProfileComplete: profileStatus !== ProfileStatus.INCOMPLETE,
            profileStatus,
            ownerType: user.ownerProfile?.ownerType ?? null,
          }
        : {}),
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
